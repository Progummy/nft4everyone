import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import {connect} from 'react-redux';
import axios from 'axios';
import {ethers} from 'ethers';
import NFTArtify from '../../artifacts/contracts/NFTArtify.json';

class HTMLButton extends React.Component {
    constructor (props) {
        super(props);
        const contractAddress = '0x3494B7d8550fa88F8A2aF8C39F94eaedB0EFFC62';
        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        this.signer = this.provider.getSigner();
        this.contract = new ethers.Contract(contractAddress, NFTArtify.abi, this.signer);
    }

    handleFileUpload (fileData) {
        const data = new FormData();
        const timestamp = new Date().toISOString();

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
            .then(response => {
                const imageHash = response.data.IpfsHash;
                const animationHash = response.data.IpfsHash;
                this.jsonFileUpload(imageHash, animationHash);
            })
            .catch(error => {
                console.log(error);
            })
    }

    jsonFileUpload (imageHash, animationHash) {
        const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageHash}`;
        const animationUrl = `https://gateway.pinata.cloud/ipfs/${animationHash}`;
        const json = `{
            "name": "pinFileJSON",
            "description": "hello pinata world",
            "image": "${imageUrl}",
            "animation_url": "${animationUrl}"
        }`;

        const data = new FormData();
        const timestamp = new Date().toISOString();

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
                this.mintToken(response.data.IpfsHash)
                .then(result => {
                    console.log(result);
                    result.wait()
                    .then(data => {
                        console.log(data);
                        this.provider.waitForTransaction(result.hash)
                        .then(() => {
                            this.provider.getTransactionReceipt(result.hash)
                            .then(receipt => {
                                const tokenId = parseInt(receipt.logs[0].topics[3])
                                console.log(tokenId);
                            })
                        });
                    });
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
                    console.log("HTML");
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
                <span>Upload to Pinata</span>
            </Button>
        );
    }
}

HTMLButton.propTypes = {
    className: PropTypes.string,
    saveProjectSb3: PropTypes.func
};

const mapStateToProps = state => ({
    saveProjectSb3: state.scratchGui.vm.saveProjectSb3.bind(state.scratchGui.vm)
});

export default connect(
    mapStateToProps,
    () => ({}) // omit dispatch prop
)(HTMLButton);