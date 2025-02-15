sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "uimodule/services/cda_operations"
], function (MessageBox, MessageToast, DateFormat, Fragment, CDA_operations) {
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
            const sFolder = "Desvios Ambientales";
        
            const files = oModel.getProperty("/DatosFormularioCDA/EditSection/documento/DocumentacionAdicional/Documentacion") || [];
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
                oModel.setProperty("/DatosFormularioCDA/EditSection/documento/DocumentacionAdicional/Documentacion", [...fileList, file]);
                oModel.setProperty("/DatosFormularioCDA/EditSection/documento/documento/File", oFile);
                oModel.setProperty("/DatosFormularioCDA/EditSection/documentAttachmentData", aDocumentData );
            } else {
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/DocumentacionAdicional", [...fileList, file]);
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/File", oFile);
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documentAttachmentData", aDocumentData );
            }
            
        },

        _resetFileUploader: function( oView, sAction ) { 
            const oModel = oView.getModel("mainModel");
            if ( sAction === "Create") {
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/FechaDeteccion", null);
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documentAttachmentData", [] );
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/DocumentacionAdicional/Documentacion", {} );
                oModel.setProperty("/DatosFormularioCDA/payload/uploadCDA/documento/File", {} );
                let oFileUploader = oView.byId("fileUploaderCDA"); 
                    oFileUploader.clear();
            } else {
                oModel.setProperty("/DatosFormularioCDA/EditSection/FechaDeteccion", null);
                oModel.setProperty("/DatosFormularioCDA/EditSection/documentAttachmentData", [] );
                oModel.setProperty("/DatosFormularioCDA/EditSection/documento/DocumentacionAdicional/Documentacion", {} );
                oModel.setProperty("/DatosFormularioCDA/EditSection/documento/File", {} );
                let oFileUploader = oView.byId("fileUploaderCDAedit"); 
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
                 oModel.setProperty("/DatosFormularioCDA/DetailSection/selectedRow", oSelectedRow );
                 oModel.setProperty("/DatosFormularioCDA/DetailSection/documentAttachmentData", aDocumentData );

    
                if (!oView.byId("detailCDADialog")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.controlDesviosAmbientales.detail.DetailCDA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("detailCDADialog").open();
                }
            },

            onEdit: function (  oView , oController, oEvent, oModel ) {
                let oButton = oEvent.getSource();
                let oItem = oButton.getParent();
                let oContext = oItem.getBindingContext("mainModel");
                let sFormattedDate = "";

                let oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "dd/MM/yyyy"
                });
                
    
                // Obtener los datos de la fila seleccionada
                let oSelectedRow = oContext.getObject();

                if (oSelectedRow.fecha_deteccion) {
                    let oDate = new Date(oSelectedRow.fecha_deteccion + "T00:00:00"); // Añadir tiempo para evitar conversión a UTC
                    let localDate = new Date(oDate.getTime() + oDate.getTimezoneOffset() * 60000); // Ajustar a zona horaria local
                     sFormattedDate = oDateFormat.format(localDate); // Formatear la fecha
                }
                
                oSelectedRow.formattedFechaDeteccion = sFormattedDate;

                const aDocumentData = [{
                    documentoNombre: oSelectedRow.nombre_archivo,
                    documentoFecha: oSelectedRow.createdAt
                }];
                
    
                 // Establecer el informe en el modelo para el diálogo
                 oModel.setProperty("/DatosFormularioCDA/EditSection/selectedRow", oSelectedRow );
                 oModel.setProperty("/DatosFormularioCDA/EditSection/documentAttachmentData", aDocumentData );
    
                if (!oView.byId("editCDADialog")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.controlDesviosAmbientales.edit.EditCDA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("editCDADialog").open();
                }
            },

            _handleDeleteCdaDocument: async function (oEvent, oView, oModel, oController) {
                let confirmMessage = oView.getModel("i18n").getResourceBundle().getText("deleteCdaDocument");
            
                return new Promise((resolve, reject) => {
                    MessageBox.confirm(confirmMessage, {
                        actions: [MessageBox.Action.CANCEL, "Aceptar"],
                        emphasizedAction: "Aceptar",
                        onClose: async (sAction) => {
                            if (sAction !== "Aceptar")
                                return reject();
            
                            try {
                                let oButton = oEvent.getSource();
                                let oItem = oButton.getParent();
                                let oContext = oItem.getBindingContext("mainModel");
            
                                // Obtener los datos de la fila seleccionada
                                let oSelectedRow = oContext.getObject();
            
                                await CDA_operations.deleteRow(oSelectedRow.ID, oController);
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }
                    });
                });
            }
    };
});