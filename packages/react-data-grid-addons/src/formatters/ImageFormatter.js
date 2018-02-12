const React = require('react');
import PropTypes from 'prop-types';
require('../../../../themes/react-data-grid-image.css');

let PendingPool = {};
let ReadyPool = {};

class ImageFormatter extends React.Component {
  static propTypes = {
    value: PropTypes.string.isRequired
  };

  state = {
    ready: false
  };

  componentWillMount() {
    this._load(this.props.value);
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({value: null});
      this._load(nextProps.value);
    }
  }

  _load = (src) => {
    let imageSrc = src;
    if (ReadyPool[imageSrc]) {
      this.setState({value: imageSrc});
      return;
    }

    if (PendingPool[imageSrc]) {
      PendingPool[imageSrc].push(this._onLoad);
      return;
    }

    PendingPool[imageSrc] = [this._onLoad];

    let img = new Image();
    img.onload = () => {
      PendingPool[imageSrc].forEach(callback => {
        callback(imageSrc);
      });
      delete PendingPool[imageSrc];
      img.onload = null;
      imageSrc = undefined;
    };
    img.src = imageSrc;
  };

  _onLoad = (src) => {
    if (this._isMounted && src === this.props.value) {
      this.setState({
        value: src
      });
    }
  };

  render() {
    let style = this.state.value ?
    { backgroundImage: 'url(' + this.state.value + ')'} :
    undefined;

    return <div className="react-grid-image" style={style} />;
  }
}


module.exports = ImageFormatter;
