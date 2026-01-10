function updateMainApplication(content) {
  if (!content.includes('import atacte.seguranca.LocationPackage')) {
    const importIndex = content.indexOf('import expo.modules.ApplicationLifecycleDispatcher');
    if (importIndex !== -1) {
      content = content.slice(0, importIndex) +
        'import atacte.seguranca.LocationPackage\n' +
        content.slice(importIndex);
    }
  }

  if (!content.includes('LocationPackage()')) {
    const packagesIndex = content.indexOf('PackageList(this).packages.apply');
    if (packagesIndex !== -1) {
      const addIndex = content.indexOf('// Packages that cannot be autolinked', packagesIndex);
      if (addIndex !== -1) {
        const insertIndex = content.indexOf('\n', addIndex) + 1;
        content = content.slice(0, insertIndex) +
          '              add(LocationPackage())\n' +
          content.slice(insertIndex);
      } else {
        const applyIndex = content.indexOf('apply {', packagesIndex);
        if (applyIndex !== -1) {
          const insertIndex = content.indexOf('\n', applyIndex) + 1;
          content = content.slice(0, insertIndex) +
            '              add(LocationPackage())\n' +
            content.slice(insertIndex);
        }
      }
    }
  }

  return content;
}

module.exports = { updateMainApplication };

