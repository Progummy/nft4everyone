import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import axios from 'axios';

class HTMLButton extends React.Component {
    constructor (props) {
        super(props);
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
                    formData.append('x', 100); // FIXME
                    formData.append('y', 150); // FIXME
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
                        console.log(res);
                    }).catch(err => {
                        console.log()`Failed... ${err}`;
                    });

                }}
            >
                <span>Create HTML</span>
            </Button>
        );
    }
}

HTMLButton.propTypes = {
    className: PropTypes.string
};

export default HTMLButton;