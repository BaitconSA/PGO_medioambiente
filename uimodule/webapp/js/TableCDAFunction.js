sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (MessageBox, MessageToast, DateFormat, Fragment) {
    "use strict";

    return {

        _showMessage: function (oView, sTitle, sText, sType) {
            var oMessageStrip = oView.byId("messageStripCDA");

            oMessageStrip.setText(`${sTitle}: ${sText}`);
            oMessageStrip.setType(sType);
            oMessageStrip.setVisible(true);
        },

        onOpenDialogCDA: function ( oView, oController, oModel ) {
           /* let aPsdaData = oModel.getProperty("/managementOptionsIcon/PSDAData");
            aPsdaData.push({
                fechaUltimoMesInformado: "",
                fechaMesAInformar: "",
                control: "",
                estado: ""
            });
            oModel.setProperty("/managementOptionsIcon/PSDAData", aPsdaData); */
    
                if (!oView.byId("addDesvioDialog")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.controlDesviosAmbientales.dialogUploadCDA.uploadCDA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("addDesvioDialog").open();
                }
        },

        onSelectFile: function ( oView, oEvent, oModel ) {
            const file = oEvent.getParameter("files")[0];
            // Asegurarse de que 'files' sea un array
           let files = oModel.getProperty("/DatosFormularioCDA/payload/uploadCDA/documento/DocumentacionAdicional");
           if (!Array.isArray(files)) {
               files = [];
               oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/DocumentacionAdicional", files);
           }
           const duplicate = files.find(doc => doc.nombre === file.name);

           if (duplicate) {
               const errorMessage = oView.getModel("i18n").getResourceBundle().getText("duplicateDocName");
               this._showMessage(oView, "Error", errorMessage, "Error");
           } else {
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/File", file);
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/FileName", file.name);
                this._showMessage(oView, "Success", "Archivo adjuntado correctamente.", "Success");
           }
        }
    };
});