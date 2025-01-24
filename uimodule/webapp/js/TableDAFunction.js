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

        onFileUploaderChange: function(oEvent, oView, oModel, sParam ) {
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
            const sFolder = "Documentación Adicional";
        
            const files = oModel.getProperty("/DatosFormularioDA/EditSection/documento/DocumentacionAdicional/Documentacion") || [];
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
            
            if ( sParam === "Edit") {
                oModel.setProperty("/DatosFormularioDA/EditSection/documento/DocumentacionAdicional/Documentacion", [...fileList, file]);
                oModel.setProperty("/DatosFormularioDA/EditSection/documento/documento/File", oFile);
                oModel.setProperty("/DatosFormularioDA/EditSection/documentAttachmentData", aDocumentData );
            } else {
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/DocumentacionAdicional", [...fileList, file]);
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/File", oFile);
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documentAttachmentData", aDocumentData );
            }
            
        },

        _resetFileUploader: function( oView, sAction ) { 
            const oModel = oView.getModel("mainModel");
            if ( sAction === "Create") {
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/descripcion", null);
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/comentarios", null);
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documentAttachmentData", [] );
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/DocumentacionAdicional/Documentacion", {} );
                oModel.setProperty("/DatosFormularioDA/payload/uploadDA/documento/File", {} );
                let oFileUploader = oView.byId("fileUploaderDA"); 
                    oFileUploader.clear();
            } else {
                oModel.setProperty("/DatosFormularioDA/EditSection/descripcion", null);
                oModel.setProperty("/DatosFormularioDA/EditSection/comentarios", null);
                oModel.setProperty("/DatosFormularioDA/EditSection/documentAttachmentData", [] );
                oModel.setProperty("/DatosFormularioDA/EditSection/documento/DocumentacionAdicional/Documentacion", {} );
                oModel.setProperty("/DatosFormularioDA/EditSection/documento/File", {} );
                let oFileUploader = oView.byId("fileUploaderDAedit"); 
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
             oModel.setProperty("/DatosFormularioDA/DetailSection/selectedRow", oSelectedRow );
             oModel.setProperty("/DatosFormularioCDA/DetailSection/descripcion", oSelectedRow.descripcion );
             oModel.setProperty("/DatosFormularioCDA/DetailSection/comentarios", oSelectedRow.comentarios );
             oModel.setProperty("/DatosFormularioCDA/DetailSection/documentAttachmentData", aDocumentData );


            if (!oView.byId("detailDADialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "uimodule.view.documentoAdicional.detail.DetailDA",
                    controller: oController
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                oView.byId("detailDADialog").open();
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
             oModel.setProperty("/DatosFormularioDA/EditSection/selectedRow", oSelectedRow );
             oModel.setProperty("/DatosFormularioDA/EditSection/descripcion", oSelectedRow.descripcion );
             oModel.setProperty("/DatosFormularioDA/EditSection/comentarios", oSelectedRow.comentarios );
             oModel.setProperty("/DatosFormularioDA/EditSection/documentAttachmentData", aDocumentData );

            if (!oView.byId("editDialogDA")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "uimodule.view.documentoAdicional.edit.EditDA",
                    controller: oController
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                oView.byId("editDialogDA").open();
            }
        }
    };
});