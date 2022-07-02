import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import Button from '../button/button.jsx';

class MetaMaskButton extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            walletAddress: null
        };
    }

    render () {
        return (
            <Button
                className={classNames(
                    this.props.className
                )}
                onClick={() => {
                    const { ethereum } = window;
                    ethereum.request({ method: 'eth_requestAccounts' })
                    .then(ethereum.request({ method: 'eth_accounts' }))
                    .then(r => {
                        console.log(r[0]);
                        this.setState({
                            walletAddress: r[0]
                        });
                    });
                }}
            >
                {this.state.walletAddress ? (
                    <span
                        title={this.state.walletAddress}
                    >
                        {this.state.walletAddress.substr(0, 5) + '...'}
                    </span>
                ) : (
                    <span>Connect wallet</span>
                )}
            </Button>
        );
    }
}

MetaMaskButton.propTypes = {
    className: PropTypes.string
};

export default MetaMaskButton;
