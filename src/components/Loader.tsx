import React from "react";

const Loader: React.FC = () => {
  return (
    <div className="ldr-loader">
      <div className="ldr-container">
        <div className="ldr-carousel">
          <div className="ldr-love" />
          <div className="ldr-love" />
          <div className="ldr-love" />
          <div className="ldr-love" />
          <div className="ldr-love" />
          <div className="ldr-love" />
          <div className="ldr-love" />
        </div>
      </div>
      <div className="ldr-container">
        <div className="ldr-carousel">
          <div className="ldr-death" />
          <div className="ldr-death" />
          <div className="ldr-death" />
          <div className="ldr-death" />
          <div className="ldr-death" />
          <div className="ldr-death" />
          <div className="ldr-death" />
        </div>
      </div>
      <div className="ldr-container">
        <div className="ldr-carousel">
          <div className="ldr-robots" />
          <div className="ldr-robots" />
          <div className="ldr-robots" />
          <div className="ldr-robots" />
          <div className="ldr-robots" />
          <div className="ldr-robots" />
          <div className="ldr-robots" />
        </div>
      </div>
    </div>
  );
};

export default Loader;
