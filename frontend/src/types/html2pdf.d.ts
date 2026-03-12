declare module "html2pdf.js" {
  interface Html2PdfOptions {
    filename?: string;
    margin?: number;
  }
  interface Html2PdfInstance {
    set: (opts: Html2PdfOptions) => Html2PdfInstance;
    from: (el: HTMLElement) => Html2PdfInstance;
    save: () => Promise<void>;
  }
  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}
