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