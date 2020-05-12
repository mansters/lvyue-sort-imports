import * as vscode from 'vscode';
import { last, remove, cloneDeep, head } from 'lodash';
import { TypescriptImport } from "./TypescriptImport";
import { ObjectStruct } from './interface';
const fs = require('fs');

const reactRelated = ['react', 'react-redux', 'redux'];
const lvyueRelated = ['lvyue-design', 'lvyue-components-combo'];
const styleSuffix = ['css', 'less', 'scss', 'sass'];
const componentSuffix = ['jsx', 'tsx', ''];
const importOrder = [
  'hocs', 'components', 'containers',
  'interface', 'hooks', 'action',
  'api', 'utils'
];

const getFileName = (path: string) => last(path.split('/')) || '';
const getPrefix = (path: string) => {
  let _path = cloneDeep(path);

  if (path.indexOf('@/') === 0) {
    _path = _path.substr(2);
  } else if (_path.indexOf('@') === 0) {
    _path = _path.substr(1);
  }

  return head(path.split('/')) || '';
};
const getSuffix = (path: string) => {
  const filename = getFileName(path).split('.');
  return filename.length === 1 ? '' : (last(filename) || '');
};

const isNpmPackages = (path: string) => path.split('/').length === 1;
const isReactPackages = (path: string) => (
  isNpmPackages(path) && (
    reactRelated.includes(path) ||
    path.includes('react')
  )
);
const isLvyuePackages = (path: string) => lvyueRelated.includes(path);
const isPathStartWith = (symbol: string) => (path: string) => path.indexOf(symbol) === 0;
const isParentPath = isPathStartWith('../');
const isSiblingPath = isPathStartWith('./');
const isStylePath = (path: string) => styleSuffix.includes(getSuffix(path));
const isInterfacePath = (path: string) => path.toLowerCase().includes('interface');
const isComponentPath = (path: string) => componentSuffix.includes(getSuffix(path));

// import类型分组
const genImportSet = (imports: TypescriptImport[], iteratee: (item: TypescriptImport, type: string) => boolean) => {
  return importOrder.reduce((set, type) => {
    const typeSet = remove(imports, item => iteratee(item, type));
    return {
      ...set,
      [type]: typeSet,
    };
  }, {} as ObjectStruct<TypescriptImport[]>);
};

// 将import分组集合排序
const sortImportSet = (
  importSet: ObjectStruct<TypescriptImport[]>,
  interfaces: TypescriptImport[],
  components: TypescriptImport[],
) => {
  const result: TypescriptImport[][] = [];

  importOrder.forEach(type => {
    result.push(importSet[type]);
    if (type === 'containers') {
      result.push(interfaces);
    }

    if (type === 'hocs' && components.length) {
      result.push(components);
    }
  });

  return result;
};

// 各项分组组内排序
const sortGroup = (groups: TypescriptImport[][]): TypescriptImport[] => {
  return groups.reduce((list, group) => {
    group.sort((a, b) => a.path.localeCompare(b.path, 'en', { sensitivity: 'base' }));
    list.push(...group);
    return list;
  }, [] as TypescriptImport[]);
};



function getDependencies(document?: vscode.TextDocument | null) {
  if (!document) {
    document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
  }
  if (!document) {
    vscode.window.showErrorMessage('当前激活的编辑器不是文件或者没有文件被打开!');
    return [];
  }

  const packageJSONPath = `${vscode.workspace.rootPath}/package.json`;

  // 判断package.json是否存在
  try {
    fs.accessSync(packageJSONPath, fs.constants.R_OK);
  } catch (err) {
    vscode.window.showInformationMessage('未检测到package.json文件, 建议在项目中打开以保证排序的有效性!');
    return [];
  }

  const fsio = fs.readFileSync(packageJSONPath); //读入文件入内容 同步执行阻塞
  const packageJSON = JSON.parse(fsio) || {};

  return Object.keys({
    ...packageJSON.dependencies,
    ...packageJSON.devDependencies,
  });
}

export function lvyueImportSort(
  imports: TypescriptImport[],
  document: vscode.TextDocument,
) {
  const dependencies = getDependencies(document); // package.json 依赖
  const _imports = cloneDeep(imports);

  const hasPackageJson = !!dependencies.length;

  const npmPackages = remove(_imports, hasPackageJson ?
    item => dependencies.includes(item.path) :
    item => isNpmPackages(item.path)
  );
  const lvyuePackages = remove(npmPackages, item => isLvyuePackages(item.path));
  const reactPackages = remove(npmPackages, item => isReactPackages(item.path));

  // store
  const store = remove(
    hasPackageJson ? _imports : npmPackages,
    item => item.path.includes('store'),
  );
  const constants = remove(_imports, item => getPrefix(item.path) === 'constants');

  // parent or global interface file
  const parentInterfaces = remove(_imports, item => isInterfacePath(item.path) && !isSiblingPath(item.path));

  // style
  const styles = remove(_imports, item => isStylePath(item.path));

  // Absolute path alias (hocs, components, containers, interface, hooks, action, api, utils)
  const importSet = genImportSet(_imports, (item, type) => getPrefix(item.path) === type);

  // sibling path alias
  const siblingImportSet = genImportSet(_imports, (item, type) => getPrefix(item.path.substr(2)) === type);

  const components = remove(_imports, item => isComponentPath(item.path));

  return sortGroup([
    reactPackages,
    npmPackages,
    lvyuePackages,
    ...sortImportSet(importSet, parentInterfaces, []),
    _imports,
    store,
    constants,
    ...sortImportSet(siblingImportSet, [], components),
    styles,
  ]);
}

