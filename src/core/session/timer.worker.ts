/// <reference lib="webworker" />
const interval = setInterval(() => {
  postMessage('tick');
}, 1000);

self.addEventListener('message', (event: MessageEvent) => {
  if (event.data === 'stop') clearInterval(interval);
});

export {};
