import React, { Component } from "react";
import ReactDOM from "react-dom";

import Slider from "./slider";

import "./styles.css";

const slides = [
  { id: 1, src: "https://picsum.photos/600/300?random=1", bg: "#123123" },
  { id: 2, src: "https://picsum.photos/600/300?random=2", bg: "#123123" },
  { id: 3, src: "https://picsum.photos/600/300?random=3", bg: "#123123" },
  { id: 4, src: "https://picsum.photos/600/300?random=4", bg: "#123123" },
  { id: 5, src: "https://picsum.photos/600/300?random=5", bg: "#123123" }
];

function SliderItem({ id, src, visible }) {
  return (
    <div className={"slide " + visible} key={id}>
      <div
        className="slide-div"
        style={{
          backgroundImage: visible ? `url(${src})` : "none",
          height: 200
        }}
      >
        <div className="slide-num">{id}</div>
      </div>
    </div>
  );
}

class App extends Component {
  state = {
    slides
  };

  componentDidMount() {
    // const mask = [
    //   [0, 1],
    //   [0, 2],
    //   [0, 3],
    //   [0, 4]
    //   [1, 3],
    //   [0, 2],
    //   [3, 4],
    //   [0, 4],
    //   [0, 1]
    // ];
    // this.i = 0;
    // setInterval(() => {
    //   const { i } = this;
    //   const newSlides = [...slides].splice(...mask[i]);
    //   this.setState({ slides: newSlides });
    //   if (i === 3) {
    //     this.i = 0;
    //   } else {
    //     this.i++;
    //   }
    // }, 2000);
  }

  render() {
    const { slides } = this.state;
    // console.log("slides", slides);
    return (
      <div className="App">
        <div className="iphone">
          <Slider
            sensitivity={0.2}
            intersectionPathToSlide={20}
            scrollInterval={2000}
            blockScrollClassname="blockscroll"
            onBlockingScroll={block => {
              // console.log("onBlockingScrill", block);
            }}
            infinite
            render={({ src, bg }) => (
              <div style={{ background: bg, height: 200 }} />
            )}
          >
            {slides.map(s => (
              <SliderItem key={s.id} {...s} />
            ))}
          </Slider>
        </div>
        <div className="iphone">
          <Slider
            sensitivity={0.2}
            intersectionPathToSlide={20}
            blockScrollClassname="blockscroll"
            onBlockingScroll={block => {
              // console.log("onBlockingScrill", block);
            }}
            render={({ src, bg }) => (
              <div style={{ background: bg, height: 200 }} />
            )}
          >
            {slides.map(s => (
              <SliderItem key={s.id} {...s} />
            ))}
          </Slider>
        </div>
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
