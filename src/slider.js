import React, { Component, createRef } from "react";

import "./styles.css";

function animate({ timing, draw, duration }) {
  let start = performance.now();
  requestAnimationFrame(function animate(time) {
    let timeFraction = (time - start) / duration;
    if (timeFraction > 1) timeFraction = 1;
    let progress = timing(timeFraction);
    draw(progress);
    if (timeFraction < 1) {
      requestAnimationFrame(animate);
    }
  });
}

function quad(timeFraction) {
  return Math.pow(timeFraction, 2);
}

function makeEaseInOut(timing) {
  return function(timeFraction) {
    if (timeFraction < 0.5) return timing(2 * timeFraction) / 2;
    else return (2 - timing(2 * (1 - timeFraction))) / 2;
  };
}

const animateFn = cb =>
  animate({ timing: makeEaseInOut(quad), draw: cb, duration: 400 });

function clamp(min, max, value) {
  return Math.min(Math.max(value, min), max);
}

const cursorPositionX = event => {
  if (event.touches && event.touches.length) {
    return event.touches[0].clientX;
  }
  if (event.changedTouches && event.changedTouches.length) {
    return event.changedTouches[0].clientX;
  }
  return event.clientX || event.layerX;
};

const cursorPosition = event => {
  if (event.touches && event.touches.length) {
    const { clientX, clientY } = event.touches[0];
    return { clientX, clientY };
  }
  if (event.changedTouches && event.changedTouches.length) {
    const { clientX, clientY } = event.changedTouches[0];
    return { clientX, clientY };
  }
  const { clientX, clientY, layerX, layerY } = event;
  if (clientX != null) {
    return { clientX, clientY };
  }
  return { clientX: layerX, clientY: layerY };
};

class Slider extends Component {
  constructor({ infinite }) {
    super();
    this.sliderRef = createRef();

    this.x = 0;
    this.touched = false;
    this.stopAnimation = false;
    this.longAutoscroll = false;

    this.startTime = 0;
    this.startX = 0;
    this.startY = 0;

    this.slideWidth = 0;
    this.totalWidth = 0;
    this.sliderWidth = 0;
    this.centerOffset = 0;

    this.nextSlideNum = infinite ? -2 : 0;
    this.num = infinite ? -2 : 0;

    this.state = {
      xPos: 0
    };
  }

  componentDidMount() {
    this.initSizes();
    if (this.props.scrollInterval) {
      this.setAutoscroll(this.props.scrollInterval);
    }
  }

  componentDidUpdate({ children: prevChildren }) {
    const { children } = this.props;
    if (prevChildren.length !== children.length) {
      this.initSizes();
      const { slideWidth, centerOffset } = this;
      const maxNum = -(children.length - 1);
      if (this.nextSlideNum <= maxNum) {
        this.stopAnimation = true;
        this.setState(
          {
            xPos: maxNum * slideWidth + centerOffset
          },
          () => {
            this.stopAnimation = false;
          }
        );
      }
    }
  }

  initSizes() {
    const {
      current: { clientWidth: sliderWidth, children }
    } = this.sliderRef;

    const { length } = this.props.children;
    if (!length) return;
    this.slideWidth = children[0].offsetWidth;
    this.totalWidth = this.slideWidth * this.props.children.length;
    this.sliderWidth = sliderWidth;
    this.centerOffset = (this.sliderWidth - this.slideWidth) / 2;
    const { infinite } = this.props;
    if (infinite) {
      if (!this.state.xPos) {
        this.setState({ xPos: -this.slideWidth * 2 + this.centerOffset });
      }
    } else {
      if (length < 2) {
        this.setState({ xPos: this.centerOffset });
      }
    }
  }

  addEventListeners = (remove = false) => {
    if (!this.props.infinite && this.props.children.length < 2) return;
    if (remove) {
      window.removeEventListener("mousemove", this.onMouseMove);
      window.removeEventListener("touchmove", this.onMouseMove);
      window.removeEventListener("mouseup", this.onMouseUp);
      window.removeEventListener("touchend", this.onMouseUp);
    } else {
      window.addEventListener("mousemove", this.onMouseMove);
      window.addEventListener("touchmove", this.onMouseMove);
      window.addEventListener("mouseup", this.onMouseUp);
      window.addEventListener("touchend", this.onMouseUp);
    }
  };

  setAutoscroll(time) {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      const n = this.getSlideNum(this.state.xPos) - 1;
      const { length } = this.props.children;
      const { infinite, scrollInterval } = this.props;
      const num = infinite ? n : clamp(-length + 1, 0, n);
      this.goToSlide(num);
      if (this.longAutoscroll) {
        this.setAutoscroll(scrollInterval);
        this.longAutoscroll = false;
        return;
      }
    }, time);
  }

  onMouseDown = e => {
    const { clientX, clientY } = cursorPosition(e);
    this.touched = true;
    this.stopAnimation = true;
    this.x = clientX - this.state.xPos;
    this.startX = clientX;
    this.startY = clientY;
    this.startTime = Date.now();
    this.num = this.getSlideNum(this.state.xPos);
    this.addEventListeners();
  };

  getSlideNum = position => {
    const { slideWidth } = this;
    if (!slideWidth) return 0;
    const centerOffset = (this.sliderWidth - this.slideWidth) / 2;
    const d = (position - centerOffset) / slideWidth;
    return Math.round(d);
  };

  onMouseMove = e => {
    if (this.touched) {
      const { clientX, clientY } = cursorPosition(e);
      const { x } = this;
      if (this.props.infinite) {
        this.setState({ xPos: clientX - x });
      } else {
        const diffX = Math.abs(clientX - this.startX);
        const diffY = Math.abs(clientY - this.startY);

        if (diffX / 2 > diffY) {
          this.toggleScrollBlocking(true);
        }
        const diff = clamp(
          -this.totalWidth + this.slideWidth + this.centerOffset,
          0,
          clientX - x
        );

        this.setState({ xPos: diff });
      }
    }
  };

  onMouseUp = e => {
    const clientX = cursorPositionX(e);
    const { startX } = this;
    const { infinite, scrollInterval } = this.props;
    const time = Date.now() - this.startTime;
    this.startTime = 0;
    const path = (Math.abs(startX - clientX) / this.sliderWidth) * 100;
    const isQuick = infinite ? 0 : path / time > this.props.sensitivity;
    this.stopAnimation = false;
    this.touched = false;
    this.startX = 0;
    this.startY = 0;
    const { num } = this;
    const koeff = isQuick ? 2 : 1;
    const step = startX - clientX ? (startX - clientX > 0 ? -koeff : koeff) : 0;
    const { intersectionPathToSlide } = this.props;
    const nextSlideNum = path >= intersectionPathToSlide ? num + step : num;
    this.nextSlideNum = nextSlideNum;
    this.goToSlide(nextSlideNum);

    if (scrollInterval && nextSlideNum !== num) {
      this.longAutoscroll = true;
      this.setAutoscroll(scrollInterval * 2);
    }

    this.toggleScrollBlocking(false);
    this.addEventListeners(true);
  };

  goToSlide = n => {
    const { xPos } = this.state;
    const { length } = this.props.children;
    const { infinite } = this.props;
    const num = infinite ? n : clamp(-length + 1, 0, n);
    this.num = num;
    const pos = num * this.slideWidth;
    const diff = num || infinite ? xPos - pos - this.centerOffset : xPos - pos;
    if (diff) {
      animateFn(p => {
        if (this.stopAnimation) return;
        if (p < 1) {
          this.setState({ xPos: xPos - diff * p });
        } else {
          this.setState({ xPos: xPos - diff * p }, () =>
            this.afterAnimation(num)
          );
        }
      });
    }
  };

  jumpToSlide = num => {
    const { xPos } = this.state;
    const pos = num * this.slideWidth;
    const diff = xPos - pos - this.centerOffset;
    this.setState({ xPos: xPos - diff });
  };

  afterAnimation = num => {
    const { infinite } = this.props;
    if (!infinite) return;
    const { length } = this.props.children;
    if (num >= 0) {
      // left
      this.jumpToSlide(-length);
      return;
    }
    if (num <= -(length + 1)) {
      this.jumpToSlide(-1);
      return;
    }
  };

  toggleScrollBlocking(block) {
    if (block === this.scrollBlocking) return;
    this.scrollBlocking = block;
    const { onBlockingScroll, blockScrollClassname } = this.props;
    if (onBlockingScroll) {
      onBlockingScroll(block);
      return;
    }
    if (blockScrollClassname) {
      const { documentElement } = document;
      const action = block ? "add" : "remove";
      documentElement.classList[action](blockScrollClassname);
    }
  }

  renderSlides = () => {
    const { children, infinite } = this.props;
    if (!infinite) {
      return children.map(item => {
        return { ...item, props: { ...item.props, visible: true } };
      });
    }
    const lastTwo = children.slice(-2);
    if (lastTwo.length < 2) {
      return Object.keys([...new Array(5)]).map(index => {
        const item = lastTwo[0];
        const key = `${item.key}-${index}-copy`;
        return { ...item, key };
      });
    } else {
      return lastTwo
        .map(({ key, ...rest }) => {
          const k = key + "-copy";
          return { ...rest, key: k };
        })
        .concat(children)
        .map(item => {
          return { ...item, props: { ...item.props, visible: true } };
        });
    }
  };

  render() {
    const { xPos } = this.state;
    return (
      <div className="slider">
        <div
          className="slider-holder"
          ref={this.sliderRef}
          style={{
            transform: `translate(${xPos}px)`
          }}
          onMouseDown={this.onMouseDown}
          onTouchStart={this.onMouseDown}
        >
          {this.renderSlides()}
        </div>
      </div>
    );
  }
}

export default Slider;
