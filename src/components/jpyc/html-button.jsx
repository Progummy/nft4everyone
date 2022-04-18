import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';

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