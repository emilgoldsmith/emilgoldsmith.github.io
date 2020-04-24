class Timer {
  startFromZero() {
    this.startTimeMs = this.__getCurTimeInMs();
    this.endTime = null;
  }

  stop() {
    this.stopTime = this.__getCurTimeInMs() - this.startTimeMs;
  }

  msElapsed() {
    const endOfIntervalMs =
      this.endTime !== null ? this.endTime : this.__getCurTimeInMs();
    return endOfIntervalMs - this.startTimeMs;
  }

  secondsElapsed() {
    return this.msElapsed() / 1000;
  }

  __getCurTimeInMs() {
    return new Date().getTime();
  }
}
