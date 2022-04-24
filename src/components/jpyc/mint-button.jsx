import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import {connect} from 'react-redux';
import axios from 'axios';
import {ethers} from 'ethers';
import NFTArtify from '../../artifacts/contracts/NFTArtify.json';
import Spinner from '../spinner/spinner.jsx';
import styles from './mint-button.css';

class MintButton extends React.Component {
    constructor (props) {
        super(props);
        const contractAddress = '0x3494B7d8550fa88F8A2aF8C39F94eaedB0EFFC62';
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.contract = new ethers.Contract(contractAddress, NFTArtify.abi, this.signer);
        this.state = {
            minting: false,
            message: 'mint'
        };
    }

    handleFileUpload (fileData) {
        const data = new FormData();
        const timestamp = new Date().toLocaleString();

        data.append('file', new Blob([fileData], {type:'text/html'}));
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
        .then(fileUploadResponse => {
            const animationHash = fileUploadResponse.data.IpfsHash;
            this.handleImageUpload(animationHash);
        })
        .catch(error => {
            console.log(error);
            this.setState({
                minting: false,
                message: 'failed'
            });
            setTimeout(() => {
                this.setState({
                    message: 'mint'
                });
            }, 3000);
        });
    }

    handleImageUpload (animationHash) {
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
                    message: 'failed'
                });
                setTimeout(() => {
                    this.setState({
                        message: 'mint'
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
                this.jsonFileUpload(imageHash, animationHash);
            });
        }
    }

    jsonFileUpload (imageHash, animationHash) {
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
        const animationUrl = `https://gateway.pinata.cloud/ipfs/${animationHash}`;
        const timestamp = new Date().toLocaleString();
        const json = `{
            "name": "${timestamp}",
            "description": "Created: ${timestamp}",
            "image": "${imageUrl}",
            "animation_url": "${animationUrl}"
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
            return this.mintToken(response.data.IpfsHash);
        })
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
                    message: 'succeeded!'
                });
                setTimeout(() => {
                    this.setState({
                        message: 'mint'
                    });
                }, 3000);
            });
        })
        .catch(error => {
            console.log(error);
            this.setState({
                minting: false,
                message: 'failed'
            });
            setTimeout(() => {
                this.setState({
                    message: 'mint'
                });
            }, 3000);
        });
    }

    mintToken (ipfsHash) {
        const connection = this.contract.connect(this.signer);
        const addr = connection.address;
        const tokenURI = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        return this.contract.mint(tokenURI);
    }

    render () {
        return (
            <Button
                className={classNames(
                    this.props.className,
                    {[styles.mintButtonMinting]: this.state.minting}
                )}
                onClick={() => {
                    if (this.state.minting) return;
                    console.log("HTMLify -> Upload to Pinata -> mint");
                    this.setState({
                        minting: true
                    });
                    const formData = new FormData();
                    this.props.saveProjectSb3().then(content => {
                        formData.append('file', content);
                        axios.post(
                            'https://ov6jpqlth2.execute-api.us-east-2.amazonaws.com/default/',
                            formData,
                            {
                                headers: {
                                    'Content-Type': 'multipart/form-data'
                                }
                            }
                        ).then(res => {
                            console.log('Succeeded');
                            console.log(res.data);
                            this.handleFileUpload(res.data);
                        }).catch(err => {
                            console.log(`Failed... ${err}`);
                            this.setState({
                                minting: false,
                                message: 'failed'
                            });
                            setTimeout(() => {
                                this.setState({
                                    message: 'mint'
                                });
                            }, 3000);
                        });
                    })
                }}
            >
                {this.state.minting ? (
                    <>
                        <Spinner
                            small
                            className={styles.spinner}
                            level={'info'}
                            />
                        <span>minting...</span>
                    </>
                ) : (
                    <span>{this.state.message}</span>
                )}
            </Button>
        );
    }
}

MintButton.propTypes = {
    className: PropTypes.string,
    saveProjectSb3: PropTypes.func
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(MintButton);