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
        },

        onFileUploaderChange: function(oEvent, oView, oModel, sAction) {
                let oFileUploader = oEvent.getSource();
                let oFile = oFileUploader.oFileUpload.files[0];
                
                // Verificar si no hay un archivo seleccionado
                if (!oFile) {
                    sap.m.MessageToast.show("No se ha seleccionado ningún archivo");
                    return;
                }
                
                let sFilePath = URL.createObjectURL(oFile);
                let sFileExtension = oFile.name.split('.').pop().toLowerCase();
            
                // Datos URL documentación
                const sObraID = oModel.getProperty("/ObraData").ID;
                const sP3Codigo = oModel.getProperty("/HeaderInfo/p3");
                const sRegistroProveedor = oModel.getProperty("/HeaderInfo/supplierRegistration");
                const sFolder = "Desvios Ambientales";
            
                const files = oModel.getProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional/Documentacion") || [];
                const sUrl = `/Obras/${sObraID}_${sRegistroProveedor}/${sP3Codigo}/Medio Ambiente/${sFolder}`;
                const file = {
                    PSDA_firmada_nombre: oFile.name,
                    PSDA_firmada_formato: oFile.type,
                    PSDA_firmada_ruta: sUrl,
                    fechaAdjunto: new Date()
                };
            
                // Verificar si files es un array, de lo contrario, inicializarlo como array vacío
                const fileList = Array.isArray(files) ? files : [];
            
                // Buscar duplicados en el array de archivos
                const duplicate = fileList.find(doc => doc.PSDA_firmada_nombre === file.PSDA_firmada_nombre);
            
                if (duplicate) {
                    const errorMessage = oView.getModel("i18n").getResourceBundle().getText("duplicateDocName");
                    MessageBox.error(errorMessage);
                    return;
                }

                const aDocumentData = [{
                    documentoNombre: file.PSDA_firmada_nombre,
                    documentoFormato: file.PSDA_firmada_formato,
                    documentoFecha: file.fechaAdjunto,
                    documentoRuta: file.PSDA_firmada_ruta
                }];
                
                if ( sAction === "Edit") {
                    oModel.setProperty("/DatosFormularioIA/EditSection/documento/DocumentacionAdicional/Documentacion", [...fileList, file]);
                    oModel.setProperty("/DatosFormularioIA/EditSection/documento/documento/File", oFile);
                    oModel.setProperty("/DatosFormularioIA/EditSection/documentAttachmentData", aDocumentData );
                } else {
                    oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional", [...fileList, file]);
                    oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/File", oFile);
                    oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documentAttachmentData", aDocumentData );
                }
        },

        _resetFileUploader: function( oView, sAction ) { 
            if( sAction === "Create") {
                const oModel = oView.getModel("mainModel");
                oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documentAttachmentData", [] );
                oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/DocumentacionAdicional/Documentacion", {} );
                oModel.setProperty("/DatosFormularioIA/payload/uploadIA/documento/File", {} );
                let oFileUploader = oView.byId("fileUploaderIA"); 
                    oFileUploader.clear();
            } else {
                const oModel = oView.getModel("mainModel");
                oModel.setProperty("/DatosFormularioIA/EditSection/documentAttachmentData", [] );
                oModel.setProperty("/DatosFormularioIA/EditSection/documento/DocumentacionAdicional/Documentacion", {} );
                oModel.setProperty("/DatosFormularioIA/EditSection/documento/File", {} );
                oModel.setProperty("/DatosFormularioIA/EditSection/selectedRow", {} );
                let oFileUploader = oView.byId("fileUploaderIAedit"); 
                    oFileUploader.clear();
            }
           
            },
        
            onViewDetails: function ( oView, oController, oEvent, oModel ) {
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");
                let oSelectedRow = oContext.getObject();

    
             const aDocumentData = [{
                 documentoNombre: oSelectedRow.nombre_archivo,
                 documentoFecha: oSelectedRow.createdAt
             }];
    
                 // Establecer el informe en el modelo para el diálogo
                 oModel.setProperty("/DatosFormularioIA/DetailSection/selectedRow", oSelectedRow );
                 oModel.setProperty("/DatosFormularioIA/DetailSection/documentAttachmentData", aDocumentData );

    
                if (!oView.byId("detailIADialog")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.informeAmbiental.detail.DetailIA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("detailIADialog").open();
                }
            },

            onEdit: function (  oView , oController, oEvent, oModel ) {
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel"); 
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();

                const aDocumentData = [{
                    documentoNombre: oSelectedRow.nombre_archivo,
                    documentoFecha: oSelectedRow.createdAt
                }];
    
                 // Establecer el informe en el modelo para el diálogo
                 oModel.setProperty("/DatosFormularioIA/EditSection/selectedRow", oSelectedRow );
                 oModel.setProperty("/DatosFormularioIA/EditSection/documentAttachmentData", aDocumentData );
    
                if (!oView.byId("editDialogIA")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.informeAmbiental.edit.editIA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("editDialogIA").open();
                }
            }
    };
});