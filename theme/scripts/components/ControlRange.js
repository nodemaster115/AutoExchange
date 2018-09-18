define([
    'react',
    'game-logic/clib',
    'game-logic/stateLib',
    'lodash',
    'components/BetButton',
    'components/RangeBetButton',
    'actions/ControlsActions',
    'stores/ControlsStore',
    'game-logic/engine'
], function (
    React,
    Clib,
    StateLib,
    _,
    BetButtonClass,
    RangeBetButtonClass,
    ControlsActions,
    ControlsStore,
    Engine
) {
    // var BetButton = React.createFactory(BetButtonClass);
    var RangeBetButton = React.createFactory(RangeBetButtonClass);

    var D = React.DOM;
    var currentTime, currentGamePayout;

    function getState () {
        return {
            // betSize: ControlsStore.getBetSize(), // Bet input string in bits // WRT
            // extraBetSize: ControlsStore.getExtraBetSize(), // Extra Bet input string in bits : "next game will stop on 0..."
            rangeBetSize: ControlsStore.getRangeBetSize(), // Extra Bet input string in bits : "next game will stop on 0..."
            rangeBetID: ControlsStore.getRangeBetID(), // Extra Bet input string in bits : "next game will stop on 0..."
            betInvalid: ControlsStore.getBetInvalid(), // false || string error message
            // extraBetInvalid: ControlsStore.getExtraBetInvalid(), // false || string error message
            rangeBetInvalid: ControlsStore.getRangeBetInvalid(), // false || string error message
            // cashOut: ControlsStore.getCashOut(),
            // cashOutInvalid: ControlsStore.getCashOutInvalid(), // false || string error message
            engine: Engine
        };
    }

    return React.createClass({
        displayName: 'ControlRange',

        propTypes: {
            isMobileOrSmall: React.PropTypes.bool.isRequired,
            controlsSize: React.PropTypes.string.isRequired
        },

        getInitialState: function () {
            return getState();
        },

        componentDidMount: function () {
            ControlsStore.addChangeListener(this._onChange);
            Engine.on({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                player_bet: this._onChange,
                cashed_out: this._onChange,
                placing_bet: this._onChange,
                range_bet_placed: this._onChange,
                range_bet_queued: this._onChange,
                cashing_out: this._onChange,
                cancel_range_bet: this._onChange,
                game_tick: this._onTick
            });

            setTimeout(function () {
                ControlsActions.setBetSize(Engine.nMinBetAmount);
            }, 800);
        },

        componentWillUnmount: function () {
            ControlsStore.removeChangeListener(this._onChange);
            Engine.off({
                game_started: this._onChange,
                game_crash: this._onChange,
                game_starting: this._onChange,
                player_bet: this._onChange,
                cashed_out: this._onChange,
                placing_bet: this._onChange,
                range_bet_placed: this._onChange,
                range_bet_queued: this._onChange,
                cashing_out: this._onChange,
                cancel_range_bet: this._onChange,
                game_tick: this._onTick
            });
        },

        _onTick: function () {
            var self = this;
            self.state = getState();
        },

        _onChange: function () {
            if (this.isMounted()) { this.setState(getState()); }
        },

        _placeRangeBet: function () {
            // var bet = StateLib.parseBet(this.state.betSize);
            // var extraBet = StateLib.parseBet(this.state.extraBetSize);
            var rangeBet = StateLib.parseRangeBet(this.state.rangeBetSize);
            if (isNaN(rangeBet)) rangeBet = 0;

            var rangeBetID = this.state.rangeBetID;
            // var cashOut = StateLib.parseCashOut(this.state.cashOut);

            var rangeBetInfo = {amount:rangeBet, id:rangeBetID};
            ControlsActions.placeRangeBet(rangeBetInfo );
        },

        _finishRound: function () {
            ControlsActions.finishRound(currentTime, currentGamePayout);
        },

        _setNext0: function () {
            ControlsActions.setNext0();
        },

        _cancelRangeBet: function () {
            console.log('cancel range bet');
            ControlsActions.cancelRangeBet();
        },

        _cashOut: function () {
            ControlsActions.cashOut();
        },

        _setRangeBetSize: function (rangeBetSize) {
            ControlsActions.setRangeBetSize(rangeBetSize);
        },

        _setRangeBetID: function (rangeBetID) {
            ControlsActions.setRangeBetID(rangeBetID);
        },

        _redirectToLogin: function () {
            var languageCode = document.getElementById('id_hiddenLanguageCode').value;

            if ((typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1)) { window.location = '/login/?clang=' + languageCode; } else window.location = '/?clang=' + languageCode;
        },
        render: function () {
            var self = this;
            self.state = getState();
            var isPlayingOrBetting = StateLib.isBetting(Engine) || (Engine.gameState === 'IN_PROGRESS' && StateLib.currentlyPlaying(Engine));

            var languageCode = document.getElementById('id_hiddenLanguageCode').value;
            var languageFlag = (languageCode === 'en');

            // For Admin Control Panel with Stop Button

            var rangeInfoElements_left = [];
            var rangeInfoElements_right = [];
            _.forEach(Engine.rangeInfo, function (range, index) {
                var id = range.id;
                var from;
                var to;
                if (range.range_from == range.range_to)
                    from = range.range_from / 100;
                else from = (range.range_from-1)/100;

                if(range.range_to == -1) {
                    from = from + ' ~ ';
                    to = '';
                } else if (range.range_from == range.range_to) {
                    to = '';
                } else {
                    to = ' ~ ' + range.range_to/100;
                }

                var element = D.div({className: 'md-radio custom-md-radio', style: {'marginTop':'10px'}},
                    D.input({
                        type: 'radio',
                        id: 'radio_range_' + range.id,
                        name: 'radio_range',
                        className: 'md-radiobtn',
                        value: range.id,
                        onChange: function (e) {
                            self._setRangeBetID(e.target.value);
                        }
                        //disabled: this.state.active
                    }),
                    D.label({htmlFor: 'radio_range_' + range.id, className: 'custom-control-label'},
                        D.span({className: 'inc'}),
                        D.span({className: 'check'}),
                        D.span({className: 'box'}),
                        D.span({
                            style: {
                                marginTop: '-8px',
                                marginLeft: '24px'
                            }
                        }, from + to + ( '  (x ' + range.range_multiplier + ')'))
                    )
                );

                if(range.id == self.state.rangeBetID)
                    element = D.div({className: 'md-radio custom-md-radio', style: {'marginTop':'10px'}},
                        D.input({
                            type: 'radio',
                            id: 'radio_range_' + range.id,
                            name: 'radio_range',
                            className: 'md-radiobtn',
                            value: range.id,
                            checked: 'checked',
                            onChange: function (e) {
                                self._setRangeBetID(e.target.value);
                            }
                            //disabled: this.state.active
                        }),
                        D.label({htmlFor: 'radio_range_' + range.id, className: 'custom-control-label'},
                            D.span({className: 'inc'}),
                            D.span({className: 'check'}),
                            D.span({className: 'box'}),
                            D.span({
                                style: {
                                    marginTop: '-8px',
                                    marginLeft: '24px'
                                }
                            }, from + to + ( '  (x ' + range.range_multiplier + ')'))
                        )
                    );

                if(index < Engine.rangeInfo.length / 2) {
                    rangeInfoElements_left.push(element);
                } else {
                    rangeInfoElements_right.push(element);
                }
            });

            var controlInputs = null;
            if (!this.props.isMobileOrSmall) {
                controlInputs = D.div({className: 'col-md-6 col-sm-6 col-xs-12'},
                    D.div({className: 'portlet-body form'},
                        D.form({action: '#', className: 'form-horizontal'},
                            D.div({className: 'form-body custom-form-body', style: {paddingBottom: '0px'}},
                                D.div({className: 'form-group custom-form-group', style: {marginBottom: '5px'}},
                                    D.label({className: 'col-md-6 col-xs-6 control-label'}, languageFlag ? 'Bet' : '投入算力'),
                                    D.div({className: 'col-md-6 col-xs-6'},
                                        D.div({className: 'input-group'},
                                            D.input({
                                                id: 'id_manual_bet',
                                                className: 'form-control',
                                                type: 'number',
                                                step: 1,
                                                min: 1,
                                                name: 'bet-size',
                                                value: self.state.rangeBetSize,
                                                disabled: isPlayingOrBetting,
                                                onChange: function (e) {
                                                    self._setRangeBetSize(e.target.value);
                                                }
                                            })
                                        )
                                    )
                                ),
                                D.div({ className: 'form-group form-md-radios custom-form-group' },
                                    D.div({ className: 'md-radio-list custom-md-radio-list' },
                                        D.div({className: 'col-md-6 col-xs-6'},
                                            rangeInfoElements_left
                                        ),
                                        D.div({className: 'col-md-6 col-xs-6'},
                                            rangeInfoElements_right
                                        )
                                    )
                                )
                            )
                        )
                    )
                );
            } else { // mobile
                controlInputs = D.div({className: 'col-md-6 col-xs-12'},
                    D.div({className: 'portlet-body form'},
                        D.form({action: '#', className: 'form-horizontal'},
                            D.div({className: 'form-body custom-form-body', style: {paddingBottom: '0px'}},
                                D.div({className: 'form-group custom-form-group', style: {marginBottom: '5px'}},
                                    D.label({className: 'col-md-5 col-xs-5 control-label'}, languageFlag ? 'Bet' : '投入算力'),
                                    D.div({className: 'col-md-7 col-xs-7'},
                                        D.div({className: 'input-group'},
                                            D.input({
                                                className: 'form-control',
                                                type: 'number',
                                                step: 1,
                                                min: 1,
                                                name: 'bet-size',
                                                value: self.state.rangeBetSize,
                                                disabled: isPlayingOrBetting,
                                                onChange: function (e) {
                                                    self._setRangeBetSize(e.target.value);
                                                }
                                            })
                                        )
                                    )
                                ),
                                D.div({ className: 'form-group form-md-radios custom-form-group' },
                                    D.div({ className: 'md-radio-list custom-md-radio-list' },
                                        D.div({className: 'col-md-6 col-xs-6'},
                                            rangeInfoElements_left
                                        ),
                                        D.div({className: 'col-md-6 col-xs-6'},
                                            rangeInfoElements_right
                                        )
                                    )
                                )
                            )
                        )
                    )
                );
            }

            var objBetBox = null;
            if (this.props.isMobileOrSmall) {
                objBetBox = D.div({ className: 'row' },
                    controlInputs,
                    D.div({className: 'col-md-5 col-sm-6 col-xs-12'},
                        D.div({ className: 'row button-container' },
                            RangeBetButton({
                                engine: this.state.engine,
                                placeBet: this._placeRangeBet,
                                cancelBet: this._cancelRangeBet,
                                // cashOut: this._cashOut,
                                isMobileOrSmall: this.props.isMobileOrSmall,
                                // betSize: this.state.betSize.toString(),
                                // extraBetSize: this.state.extraBetSize.toString(),
                                rangeBetSize: this.state.rangeBetSize.toString(),
                                // betInvalid: this.state.betInvalid,
                                // extraBetInvalid: this.state.extraBetInvalid,
                                rangeBetInvalid: this.state.rangeBetInvalid,
                                // cashOutInvalid: this.state.cashOutInvalid,
                                controlsSize: this.props.controlsSize
                            })
                        ),
                        D.div({className: 'form-group custom-form-group', style: {marginBottom: '5px'}},
                            D.label({className: 'col-md-5 col-xs-5 control-label', style:{fontSize:'12px'}}, languageFlag ? 'Bet Range' : '投入算力范围'),
                            D.label({className: 'col-md-7 col-xs-7 control-label', style: {textAlign:'left', fontSize:'12px'}}, Engine.nMinRangeBetAmount + '~' + Engine.nMaxRangeBetAmount + (languageFlag ? ' bits' : ' 算力'))
                        )
                    )
                );
            } else {
                objBetBox = D.div({ className: 'row' },
                    controlInputs,
                    D.div({className: 'col-md-5 col-sm-6 col-xs-12'},
                        D.div({ className: 'row button-container' },
                            RangeBetButton({
                                engine: this.state.engine,
                                placeBet: this._placeRangeBet,
                                cancelBet: this._cancelRangeBet,
                                cashOut: this._cashOut,
                                isMobileOrSmall: this.props.isMobileOrSmall,
                                betSize: 0,
                                extraBetSize: 0,
                                rangeBetSize: this.state.rangeBetSize.toString(),
                                betInvalid: this.state.betInvalid,
                                extraBetInvalid: this.state.extraBetInvalid,
                                rangeBetInvalid: this.state.rangeBetInvalid,
                                cashOutInvalid: this.state.cashOutInvalid,
                                controlsSize: this.props.controlsSize
                            })
                        ),
                        D.div({className: 'form-group custom-form-group', style: {marginBottom: '5px'}},
                            D.label({className: 'col-md-5 col-xs-5 control-label', style:{fontSize:'12px'}}, languageFlag ? 'Bet Range' : '投入算力范围'),
                            D.label({className: 'col-md-7 col-xs-7 control-label', style: {textAlign:'left', fontSize:'12px'}}, Engine.nMinRangeBetAmount + '~' + Engine.nMaxRangeBetAmount + (languageFlag ? ' bits' : ' 算力'))
                        )
                    )
                );
            }

            // If the user is logged in render the controls
            return D.div({className: 'tab-pane', id: 'tab_range', style: {marginBottom: '3px', height: '100%'}},
                objBetBox
            );
        }
    });
});