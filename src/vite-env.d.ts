/// <reference types="vite/client" />

declare module '*?worker' {
  const WorkerCtor: new (options?: { name?: string }) => Worker;
  export default WorkerCtor;
}
