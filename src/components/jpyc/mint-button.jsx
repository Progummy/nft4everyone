import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import {connect} from 'react-redux';
import axios from 'axios';
import {ethers} from 'ethers';
import NFTArtify from '../../artifacts/contracts/NFTArtify.json';

class MintButton extends React.Component {
    constructor (props) {
        super(props);
        const contractAddress = '0x3494B7d8550fa88F8A2aF8C39F94eaedB0EFFC62';
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.contract = new ethers.Contract(contractAddress, NFTArtify.abi, this.signer);
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
        });
    }

    handleImageUpload (animationHash) {
        const data = new FormData();
        const timestamp = new Date().toLocaleString();

        const canvas = document.querySelector('canvas');
        let dataURL;
        const MAX_COUNT = 100;
        let counter = 0;
        const timer = setInterval(() => {
            dataURL = canvas.toDataURL().replace(/^data:image\/png;base64,/, "");
            if (counter > MAX_COUNT || dataURL.length > 3864) {
                console.log(dataURL);
                clearInterval(timer);
                return imageUpload(dataURL);
            }
            console.log(counter);
            counter++;
        }, 100)

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
            });
        })
        .catch(error => {
            console.log(error);
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
                    this.props.className
                )}
                onClick={() => {
                    console.log("HTMLify -> Upload to Pinata -> mint");
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
                        });
                    })
                }}
            >
                <span>mint</span>
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