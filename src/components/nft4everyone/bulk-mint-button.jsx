import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import {connect} from 'react-redux';
import {ethers} from 'ethers';
import Spinner from '../spinner/spinner.jsx';
import styles from './bulk-mint-button.css';
import nft4everyone from './artifacts/nft4everyone.json';
import axios from 'axios';

class BulkMintButton extends React.Component {
    constructor (props) {
        super(props);
        const contractAddress = '0x1E461274FB8c75d0930644883dA7906ab5324CDE';
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.contract = new ethers.Contract(contractAddress, nft4everyone, this.signer);
        this.defaultMessage = 'Bulk Mint';
        this.state = {
            minting: false,
            message: this.defaultMessage
        };
        this.tokenURIs = [];
        this.combinations = [];
        this.total = 0;
        this.errors = [];
    }

    onClickBulkMint () {
        const targets = this.props.vm.runtime.targets;
        targets.forEach(target => {
            this.props.vm.setEditingTarget(target.id);
            const costumes = this.props.vm.editingTarget.sprite.costumes_;
            this.combinations.push({
              target,
              costumes
            })
        })
        // cf.) https://qiita.com/tmnck/items/0568e857af8a9bf09ba8
        let total = 1;
        for (let combination of this.combinations) {
          total *= combination.costumes.length;
        }
        this.total = total;
        let q, r, result = [];
        for (let n = 0; n < total; n++) {
            result[n] = {};
            q = n;
            this.combinations.forEach(combination => {
              let costumeLength = combination.costumes.length;
              r = q % costumeLength;
              q = Math.floor(q / costumeLength);
              result[n][combination.target.id] = r;
            })
        }
        // result.forEach(set => {
        //     Object.keys(set).forEach(targetId => {
        //         this.props.vm.setEditingTarget(targetId);
        //         this.props.vm.editingTarget.setCostume(set[targetId]);
        //     });
        //     this.props.vm.renderer.draw();
        //     this.handleImageUpload();
        // });
        let count = 0;
        let end = result.length;
        let interval = 1000;
        let func = setInterval(() => {
            let set = result[count];

            Object.keys(set).forEach(targetId => {
                this.props.vm.setEditingTarget(targetId);
                this.props.vm.editingTarget.setCostume(set[targetId]);
            });
            this.props.vm.renderer.draw();
            this.handleImageUpload();
            
            count++;
            if (count == end) {
                clearInterval(func);
            }
        }, interval);
    }

    handleImageUpload () {
        const data = new FormData();
        const timestamp = new Date().toLocaleString();

        const canvases = document.getElementsByTagName('canvas');
        let canvas;
        for (const elem of canvases) {
            if (elem.className == '') {
                canvas = elem;
                break;
            }
        }

        // FIXME: canvas.toDataURL() returns different results almost everytime,
        // and shorter one is an image of black rectangle which means nothing.
        // So, the code below call the dataURL several times until it returns
        // a longer, meaningful data.
        let dataURL;
        const DATA_URL_MIN_LENGTH = 3864;
        const MAX_COUNT = 100;
        let counter = 0;
        const timer = setInterval(() => {
            dataURL = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
            if (dataURL.length > DATA_URL_MIN_LENGTH) {
                clearInterval(timer);
                imageUpload(dataURL);
            } else if (counter > MAX_COUNT) {
                clearInterval(timer);
                this.setState({
                    minting: false,
                    message: 'Failed'
                });
                setTimeout(() => {
                    this.setState({
                        message: this.defaultMessage
                    });
                }, 3000);
            } 
            console.log(counter);
            counter++;
        }, 100);

        const imageUpload = dataURL => {
            const byteString = window.atob(dataURL);
            let buffer = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                buffer[i] = byteString.charCodeAt(i);
            }
    
            data.append('file', new Blob([buffer], {type:'image/png'}));
            data.append('pinataMetadata', `{"name": "${timestamp}"}`);
            data.append('pinataOptions', '{"cidVersion": 0}');
    
            const config = {
                method: 'post',
                url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
                headers: {
                    'pinata_api_key': process.env.PINATA_API_KEY,
                    'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
                },
                data
            };
            axios(config)
            .then(imageUploadResponse => {
                const imageHash = imageUploadResponse.data.IpfsHash;
                this.jsonFileUpload(imageHash);
            })
            .catch(error => {
                this.errors.push(error);
                console.error(error);
                this.setState({
                    minting: false,
                    message: 'Failed'
                });
                setTimeout(() => {
                    this.setState({
                        message: this.defaultMessage
                    });
                }, 3000);
            });
        }
    }

    jsonFileUpload (imageHash) {
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
        const timestamp = new Date().toLocaleString();
        const json = `{
            "name": "${timestamp}",
            "description": "Created: ${timestamp}",
            "image": "${imageUrl}"
        }`;

        const data = new FormData();

        data.append('file', new Blob([json], {type:'application/json'}));
        data.append('pinataMetadata', `{"name": "${timestamp}"}`);
        data.append('pinataOptions', '{"cidVersion": 0}');

        const config = {
            method: 'post',
            url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
            headers: {
                'pinata_api_key': process.env.PINATA_API_KEY,
                'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY
            },
            data
        };

        axios(config)
        .then(response => {
            console.log(JSON.stringify(response.data));
            const ipfsHash = response.data.IpfsHash;
            const tokenURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
            this.tokenURIs.push(tokenURI);
            if (this.tokenURIs.length + this.errors.length == this.total) {
                this.bulkMint()
                .then(result => {
                    console.log(result);
                    result.wait()
                    .then(data => {
                        console.log(data);
                        return this.provider.waitForTransaction(result.hash);
                    })
                    .then(() => {
                        return this.provider.getTransactionReceipt(result.hash);
                    })
                    .then(receipt => {
                        const tokenId = parseInt(receipt.logs[0].topics[3]);
                        console.log(tokenId);
                        this.setState({
                            minting: false,
                            message: 'Succeeded!'
                        });
                        setTimeout(() => {
                            this.setState({
                                message: this.defaultMessage
                            });
                        }, 3000);
                    })
                    .catch(error => {
                        console.error(error);
                        this.setState({
                            minting: false,
                            message: 'Failed'
                        });
                        setTimeout(() => {
                            this.setState({
                                message: this.defaultMessage
                            });
                        }, 3000);
                    });
                })
                .catch(error => {
                    console.error(error);
                    this.setState({
                        minting: false,
                        message: 'Failed'
                    });
                    setTimeout(() => {
                        this.setState({
                            message: this.defaultMessage
                        });
                    }, 3000);
                });
            }
        });
    }

    bulkMint () {
        return this.contract.mintBatch(this.tokenURIs);
    }

    // mintToken (ipfsHash) {
    //     const connection = this.contract.connect(this.signer);
    //     const tokenURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    //     return this.contract.mint(tokenURI);
    // }

    render () {
        return (
            <Button
                className={classNames(
                    this.props.className,
                    {[styles.bulkMintButtonMinting]: this.state.minting}
                )}
                onClick={() => {
                    if (this.state.minting) return;
                    console.log("bulk mint");
                    this.setState({
                        minting: true
                    });
                    this.onClickBulkMint();
                }}
            >
                {this.state.minting ? (
                    <>
                        <Spinner
                            small
                            className={styles.spinner}
                            level={'info'}
                            />
                        <span>Minting...</span>
                    </>
                ) : (
                    <span>{this.state.message}</span>
                )}
            </Button>
        );
    }
}

BulkMintButton.propTypes = {
    className: PropTypes.string,
    saveProjectSb3: PropTypes.func
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(BulkMintButton);