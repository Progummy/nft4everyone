import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import {connect} from 'react-redux';
import {activateDeck} from '../../reducers/cards';

class PurchaseJPYCButton extends React.Component {
    constructor (props) {
        super(props);
    }

    setActiveCards (tutorialId) {
        this.props.onUpdateReduxDeck(tutorialId);
    }

    render () {
        return (
            <Button
                className={classNames(
                    this.props.className
                )}
                onClick={() => {
                    const tutorialId = 'purchase-jpyc';
                    this.setActiveCards(tutorialId);
                }}
            >
                <span>Purchase JPYC</span>
            </Button>
        );
    }
}

const mapDispatchToProps = dispatch => ({
    onUpdateReduxDeck: tutorialId => {
        dispatch(activateDeck(tutorialId));
    }
})

PurchaseJPYCButton.propTypes = {
    className: PropTypes.string,
    onUpdateReduxDeck: PropTypes.func
};

export default connect(
    null,
    mapDispatchToProps
)(PurchaseJPYCButton);