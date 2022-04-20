import React, { useState, useRef, forwardRef } from 'react';
import axios from 'axios';
import FormData from 'form-data';
class PinataUploadButton extends React.Component {

  render() {
    const onFileInputChange = (e) => {
      console.log(e.target.files);
      handleFileUpload(e.target.files);
    };

    return (
      <div>
        <input type="file" onChange={onFileInputChange} />
      </div>
    );
  }

}

const handleFileUpload = function (fileInput) {
  console.log(fileInput[0]);

  //  const reader = new FileReader();
  const file = fileInput[0];

  var data = new FormData();

  data.append('file', file);
  data.append('pinataMetadata', '{\n    "name":"test wkbk" \n}');
  data.append('pinataOptions', '{\n    "cidVersion":0\n}');

  console.log(data.file);

  var config = {
    method: 'post',
    url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    headers: {
      'pinata_api_key': '',
      'pinata_secret_api_key': '',
      'content-type': 'multipart/form-data; boundary=--------------------------733383420271935845045958'
    },
    data: data
  };

  axios(config)
    .then(function (response) {

      console.log(JSON.stringify(response.data.IpfsHash));

      jsonFileUpload(response.data.IpfsHash);

    })
    .catch(function (error) {
      console.log(error);
    });
};

export default PinataUploadButton;

const jsonFileUpload = function (hash) {

  var hashText = hash;

  // var hashText = hash.slice( 1, -1 ) ;
  // console.log(hashText);


  var imageText = `https://gateway.pinata.cloud/ipfs/${hashText}`;
  console.log(imageText);


  var animationUrlText = `https://gateway.pinata.cloud/ipfs/${hashText}`;
  console.log(animationUrlText);

  var jsonText = `{
      "name": "pinFileJSON",
      "description": "hello world",
      "image": "${imageText}",
      "animation_url": "${animationUrlText}"
    }`;

  const json = JSON.stringify(jsonText);

  var data = new FormData();
  data.append('file', new Blob([jsonText], { type: 'application/json' }));
  data.append('pinataMetadata', '{\n    "name":"test wkbk" \n}');
  data.append('pinataOptions', '{\n    "cidVersion":0\n}');

  var config = {
    method: 'post',
    url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    headers: {
      'pinata_api_key': '',
      'pinata_secret_api_key': '',
      'content-type': 'multipart/form-data; boundary=--------------------------733383420271935845045958'
    },
    data: data
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
};