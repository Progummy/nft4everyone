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

  const reader = new FileReader();
  const file = fileInput[0];

  var data = new FormData();

  data.append('file', file);
  data.append('pinataMetadata', '{\n    "name":"test wkbk" \n}');
  data.append('pinataOptions', '{\n    "cidVersion":0\n}');

  var config = {
    method: 'post',
    url: 'https://api.pinata.cloud/pinning/pinFileToIPFS',
    headers: {
      'pinata_api_key': '14ab790a8edd4f609b1c',
      'pinata_secret_api_key': 'dab9ca73154e8b5c3c3e5dc116bc9a30a862ecadb6232488ffe88d507822f300',
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

export default PinataUploadButton;