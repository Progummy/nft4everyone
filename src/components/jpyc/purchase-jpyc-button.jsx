import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import Button from '../button/button.jsx';

class PurchaseJPYCButton extends React.Component {
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
                    console.log('JPYC購入、MATIC獲得');
                }}
            >
                <span>Purchase JPYC</span>
            </Button>
        );
    }
}

PurchaseJPYCButton.propTypes = {
    className: PropTypes.string
};

export default PurchaseJPYCButton;