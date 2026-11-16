export interface EditorTab {
  id: string;
  path: string;
  title: string;
  isDirty?: boolean;
}

export interface EditorThemeConfig {
  theme: 'vs-dark' | 'vs-light';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimap: boolean;
}
