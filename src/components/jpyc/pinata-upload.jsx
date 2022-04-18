import React, { useState, useRef, forwardRef } from 'react';

class PinataUploadButton extends React.Component {


  render () {
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

};

const readFile = (i, f) => {
  // if (fileInput.value == null) {
  //   // Reset the file input value now that we have everything we need
  //   // so that the user can upload the same sound multiple times if
  //   // they choose
  //   return;
  // }

  console.log(f);
  const file = f[i];
  console.log(file);
  
  const reader = new FileReader();
  reader.onload = () => {
    const fileType = file.type;
    const fileName = extractFileName(file.name);
    onload(reader.result, fileType, fileName, i, f.length);
    console.log(file)
  };
  reader.onerror = onerror;
  reader.readAsArrayBuffer(file);
};

export default PinataUploadButton;