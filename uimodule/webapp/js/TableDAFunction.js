sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment"
], function (MessageBox, MessageToast, DateFormat, Fragment) {
    "use strict";

    return {

        _showMessage: function (oView, sTitle, sText, sType) {
            var oMessageStrip = oView.byId("messageStripDA");

            oMessageStrip.setText(`${sTitle}: ${sText}`);
            oMessageStrip.setType(sType);
            oMessageStrip.setVisible(true);
        },

        onOpenDialogDA: function ( oView, oController, oModel ) {
           /* let aPsdaData = oModel.getProperty("/managementOptionsIcon/PSDAData");
            aPsdaData.push({
                fechaUltimoMesInformado: "",
                fechaMesAInformar: "",
                control: "",
                estado: ""
            });
            oModel.setProperty("/managementOptionsIcon/PSDAData", aPsdaData); */
    
                if (!oView.byId("addDocumentationDADialog")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.documentoAdicional.dialogUploadDA.uploadDA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("addDocumentationDADialog").open();
                }
        },

        onSelectFile: function ( oView, oEvent, oModel ) {
            const file = oEvent.getParameter("files")[0];
            // Asegurarse de que 'files' sea un array
           let files = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/documento/DocumentacionAdicional");
           if (!Array.isArray(files)) {
               files = [];
               oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/DocumentacionAdicional", files );
           }
           const duplicate = files.find(doc => doc.nombre === file.name);

           if (duplicate) {
               const errorMessage = oView.getModel("i18n").getResourceBundle().getText("duplicateDocName");
               this._showMessage(oView, "Error", errorMessage, "Error");
           } else {
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcion", null );
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/comentarios", null);
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/File", file);
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/FileName", file.name);
                this._showMessage(oView, "Éxito", "Documento Adicional adjunto correctamente.", "Success");
           }
        },

        validateForm: function ( oModel ) {
            const sDescription = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/descripcion");
            const sDocumentName = oModel.getProperty("/DatosFormularioDA/payload/uploadDA/documento/FileName");
            let isValidForm = true;

            if (!sDescription || sDescription.trim() === "") {
                isValidForm = false
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionValueState", "Error");
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionStateText", "La descripción no puede estar vacía.");
            } else {
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionValueState", "None");
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcionStateText", "");
            }
        
            if (!sDocumentName || sDocumentName.trim() === "") {
                isValidForm = false
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueState", "Error");
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueStateText", "El nombre del documento no puede estar vacío.");
            } else {
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueState", "None");
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/documentoValueStateText", "");
            }

            return isValidForm;
        

        }
    };
});