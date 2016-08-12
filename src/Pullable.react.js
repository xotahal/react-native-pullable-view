import { View, PanResponder, Animated, Easing, StyleSheet } from 'react-native';
import React, { Component, PropTypes } from 'react';

const propTypes = {
    /**
    * This view will be shown after pulling it down.
    */
    pullView: PropTypes.oneOfType([
        PropTypes.func,
    ]),
    /**
    * When you're pulling the view down and don't exceed the successPullDistance then the view
    * will be pushed back to the start point.
    */
    successPullDistance: PropTypes.number,
    /**
    * Heihgt of pull view. You will not be able to pull the view more than this height.
    */
    pullViewHeight: PropTypes.number,
    /**
    * Children is shown after pull view.
    */
    children: PropTypes.object,
    /**
    * Set to true, if you want to open pullView by gestures that are done on children view
    */
    childrenCanOpen: PropTypes.bool,
    /**
    * Called when the pullView will be pulled down.
    */
    onOpen: PropTypes.func,
    /**
    * Called when the pullView is pulling either down or up.
    *
    * ({x: 0, y: <0, pullViewHeight>}) => void
    */
    onPulling: PropTypes.func,
    /**
    * Called when the pullView will be pulled up.
    */
    onClose: PropTypes.func,
};
const defaultProps = {
    pullViewHeight: 150,
    successPullDistance: 30,
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    pullViewContainer: {
        flex: 1,
    },
});

const isUpGesture = (x, y) => y < 0 && (Math.abs(x) < Math.abs(y));

class Pullable extends Component {
    constructor(props) {
        super(props);

        // the view is hidden (y is set to negative view height)
        this.defaultValueXY = { x: 0, y: -props.pullViewHeight };
        this.panValue = new Animated.ValueXY(this.defaultValueXY);

        this.onLayout = this.onLayout.bind(this);
        this.finishPulling = this.finishPulling.bind(this);
        this.cancelPulling = this.cancelPulling.bind(this);
        this.onShouldSetPanResponder = this.onShouldSetPanResponder.bind(this);
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: this._onShouldSetPanResponder.bind(this),
            onMoveShouldSetPanResponder: this._onShouldSetPanResponder.bind(this),
            onPanResponderGrant: () => {},
            onPanResponderMove: this.onPanResponderMove.bind(this),
            onPanResponderRelease: this.onPanResponderRelease.bind(this),
            onPanResponderTerminate: this.onPanResponderRelease.bind(this),
        });
    }
    componentWillMount() {
        this.listenerId = this.panValue.addListener((e) => {
            const { onPulling } = this.props;

            if (onPulling) {
                onPulling({
                    x: e.x,
                    y: this.props.pullViewHeight - Math.abs(e.y),
                });
            }
        });

        this.state = Object.assign({}, this.props, {
            pan: this.panValue,
            isOpen: false,
            height: 0,
        });
    }
    componentWillUnmount() {
        this.panValue.removeListener(this.listenerId);
    }
    onShouldSetPanResponder(e, gesture) {
        return this._onShouldSetPanResponder(e, gesture, true);
    }
    onPanResponderMove(e, gesture) {
        let startY = this.defaultValueXY.y;

        if (this.state.isOpen) {
            startY = 0;
        }

        let nextY = startY + gesture.dy;
        // nextY is from interval (-this.defaultValueXY.y, 0)
        nextY = Math.min(Math.max(nextY, this.defaultValueXY.y), 0);

        this.state.pan.setValue({
            x: this.defaultValueXY.x,
            y: nextY,
        });

        if (Math.abs(gesture.dy) < this.props.successPullDistance) {
            this.setState({
                pulling: true,
                distanceExceeded: false,
            });
        } else {
            this.setState({
                pulling: false,
                distanceExceeded: true,
            });
        }
    }
    onPanResponderRelease() {
        if (this.state.pulling) {
            this.cancelPulling();
        }
        if (this.state.distanceExceeded) {
            this.finishPulling();
        }
    }
    onLayout(e) {
        const layout = e.nativeEvent.layout;
        this.setState({
            width: layout.width,
            height: layout.height,
        });
    }
    getPullView() {
        return <View />;
    }
    finishPulling() {
        const { isOpen } = this.state;
        const { onOpen, onClose } = this.props;

        Animated.timing(this.state.pan, {
            toValue: isOpen ? this.defaultValueXY : { x: 0, y: 0 },
            easing: Easing.linear,
            duration: 250,
        }).start(() => {
            this.setState({
                pulling: false,
                distanceExceeded: false,
                isOpen: !isOpen,
            });

            if (onOpen && !isOpen) {
                onOpen();
            } else if (onClose && isOpen) {
                onClose();
            }
        });
    }
    cancelPulling() {
        const { isOpen } = this.state;

        Animated.timing(this.state.pan, {
            toValue: isOpen ? { x: 0, y: 0 } : this.defaultValueXY,
            easing: Easing.linear,
            duration: 250,
        }).start(() => {
            this.setState({
                pulling: false,
                distanceExceeded: false,
            });
        });
    }
    open() {
        if (!this.state.isOpen) {
            this.finishPulling();
        }
    }
    close() {
        if (this.state.isOpen) {
            this.finishPulling();
        }
    }
    _onShouldSetPanResponder(e, gesture, isOutside) {
        const { isOpen, childrenCanOpen } = this.state;

        const isClose = !isOpen;
        const isCloseGesture = isUpGesture(gesture.dx, gesture.dy);
        const isOpenGesture = !isCloseGesture;

        // the event is from private view (see "this.refs.viewResponder")
        // user want to open view (isOpenGesture), but children (viewResponder) can't open view
        if (!isOutside && isOpenGesture && !childrenCanOpen) {
            return false;
        }
        // you can't open view that is already opened
        if (isOpen && isOpenGesture) {
            return false;
        }
        // you can't close view that is already closed
        if (isClose && isCloseGesture) {
            return false;
        }

        return true;
    }
    render() {
        const { pullView, pullViewHeight } = this.props;

        let getPullView = this.getPullView;

        if (typeof pullView === 'function') {
            getPullView = pullView;
        }

        return (
            <View style={styles.container} onLayout={this.onLayout}>
                <Animated.View style={[this.state.pan.getLayout()]}>
                    <View style={[styles.pullViewContainer, { height: pullViewHeight }]}>
                        {getPullView(this.state)}
                    </View>
                    <View
                        ref="viewResponder"
                        {...this.panResponder.panHandlers}
                        style={{ width: this.state.width, height: this.state.height }}
                    >
                        {this.props.children}
                    </View>
                </Animated.View>
            </View>
        );
    }
}


Pullable.propTypes = propTypes;
Pullable.defaultProps = defaultProps;

export default Pullable;
