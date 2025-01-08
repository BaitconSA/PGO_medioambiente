sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (MessageBox, MessageToast, DateFormat, Fragment) {
    "use strict";

    return {

        _showMessage: function (oView, sTitle, sText, sType) {
            var oMessageStrip = oView.byId("messageStripIA");

            oMessageStrip.setText(`${sTitle}: ${sText}`);
            oMessageStrip.setType(sType);
            oMessageStrip.setVisible(true);
        },

        onOpenDialogIA: function ( oView, oController, oModel ) {
           /* let aPsdaData = oModel.getProperty("/managementOptionsIcon/PSDAData");
            aPsdaData.push({
                fechaUltimoMesInformado: "",
                fechaMesAInformar: "",
                control: "",
                estado: ""
            });
            oModel.setProperty("/managementOptionsIcon/PSDAData", aPsdaData); */
    
                if (!oView.byId("addDocumentationIADialog")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.informeAmbiental.dialogUploadIA.uploadIA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("addDocumentationIADialog").open();
                }
        },

        onSelectFile: function ( oView, oEvent, oModel ) {
            const file = oEvent.getParameter("files")[0];
            // Asegurarse de que 'files' sea un array
           let files = oModel.getProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional");
           if (!Array.isArray(files)) {
               files = [];
               oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional", files );
           }
           const duplicate = files.find(doc => doc.nombre === file.name);

           if (duplicate) {
               const errorMessage = oView.getModel("i18n").getResourceBundle().getText("duplicateDocName");
               this._showMessage(oView, "Error", errorMessage, "Error");
           } else {
                oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/File", file);
                oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/FileName", file.name);
                this._showMessage(oView, "Éxito", "Informe adjuntado correctamente.", "Success");
           }
        }
    };
});