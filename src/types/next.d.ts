declare module 'next/navigation' {
  export * from 'next/dist/client/components/navigation';
}

declare module 'next/router' {
  export * from 'next/dist/client/router';
}

declare module 'next/*' {
  const content: any;
  export default content;
} 