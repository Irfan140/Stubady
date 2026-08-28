type ResolvedAssetSource = {
  uri?: string;
  width?: number;
  height?: number;
} | null;

declare module "react-native/Libraries/Image/resolveAssetSource" {
  const resolveAssetSource: (source: number) => ResolvedAssetSource;
  export default resolveAssetSource;
}

declare module "invariant" {
  const invariant: (
    condition: unknown,
    message?: string,
    ...args: unknown[]
  ) => asserts condition;
  export default invariant;
}
