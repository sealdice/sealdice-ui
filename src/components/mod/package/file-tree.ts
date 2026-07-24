export interface PackageFileTreeItem {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: PackageFileTreeItem[];
}
