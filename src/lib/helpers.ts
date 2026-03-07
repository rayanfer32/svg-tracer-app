export const handleDownloadSvg = (svgContent: string) => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traced-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
};