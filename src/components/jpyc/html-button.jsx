import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import {connect} from 'react-redux';
import axios from 'axios';

class HTMLButton extends React.Component {
    constructor (props) {
        super(props);
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
            data: data
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
        const timestamp = new Date().toISOString();
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
            data: data
        };

        axios(config)
            .then(response => {
                console.log(JSON.stringify(response.data));
            })
            .catch(error => {
                console.log(error);
            });
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
                <span>Create HTML</span>
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