sap.ui.define([
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/Fragment",
    "sap/ui/core/HTML",
    "uimodule/model/formatter",
    "uimodule/services/psda_operations"
], function (MessageBox, MessageToast, DateFormat, Fragment, HTML, Formatter, PSDA_operations) {
    "use strict";

    return {
        onAddManualRow: function ( oView, oController, oModel ) {
                if (!oView.byId("dialogUploadPSDA")) {
                    Fragment.load({
                        id: oView.getId(),
                        name: "uimodule.view.desempenioAmbiental.dialogUploadPSDA.uploadPSDA",
                        controller: oController
                    }).then(function (oDialog) {
                        oView.addDependent(oDialog);
                        oDialog.open();
                    });
                } else {
                    oView.byId("dialogUploadPSDA").open();
                }
  
        },

        // Agrego los valores que se ingresen en el modelo de datos con su correspondiente PATh.
        onInputLiveChange: function ( oEvent, oModel, ID ) {
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");
            let oContext = oInput.getBindingContext("mainModel");
            let sPath = oInput.getBindingPath("value");

            // Actualizar el modelo con el nuevo valor
            oContext.getModel().setProperty(oContext.getPath() + "/" + sPath, sValue);
        },

        onValidateDate: function ( oEvent ) {
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");
            let oDateFormat = DateFormat.getDateInstance({
                pattern: "dd/MM/yyyy"
            });

            let bValid = oDateFormat.parse(sValue);

            if (!bValid) {
                oInput.setValueState("Error");
                MessageToast.show("Por favor, ingrese una fecha en el formato dd/mm/aaaa");
            } else {
                oInput.setValueState("None");
            }
        },

        onValidateMonthYear: function (oEvent) {
            let oInput = oEvent.getSource();
            let sValue = oEvent.getParameter("value");
            let oMonthYearFormat = DateFormat.getDateInstance({
                pattern: "MM/yyyy"
            });

            let bValid = oMonthYearFormat.parse(sValue);

            if (!bValid) {
                oInput.setValueState("Error");
                MessageToast.show("Por favor, ingrese una fecha en el formato mm/aaaa");
            } else {
                oInput.setValueState("None");
            }
        },

        onAddYearRow: function ( oModel ) {
            let aYears = oModel.getProperty("/Years");
        
            let newYear = {
                year: new Date().getFullYear(), // Puedes personalizar esto según tus necesidades
                isYearBlank: true
            };
        
            aYears.push(newYear);
            oModel.setProperty("/Years", aYears);
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
            const sFolder = "Planilla Seguimiento Ambiental";
        
            const files = oModel.getProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion") || [];
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
            
            if ( sParam === "Edit") {
                oModel.setProperty("/DatosFormularioPSDA/EditSection/documento/DocumentacionAdicional/Documentacion", [...fileList, file]);
                oModel.setProperty("/DatosFormularioPSDA/EditSection/documento/File", oFile);
                const aDocumentData = [{
                    documentoNombre: file.PSDA_firmada_nombre,
                    documentoFormato: file.PSDA_firmada_formato,
                    documentoFecha: file.fechaAdjunto,
                    documentoRuta: file.PSDA_firmada_ruta
                }];
                

                 oModel.setProperty("/DatosFormularioPSDA/EditSection/documentAttachmentData", aDocumentData );
            } else {
                oModel.setProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion", [...fileList, file]);
                oModel.setProperty("/DatosFormularioPSDA/payload/documento/File", oFile);
            }
            
        
            if (sFileExtension === "pdf") {
                this._showPDFViewer(sFilePath, oView, sParam);
            } else if (["jpg", "jpeg", "png", "gif"].indexOf(sFileExtension) !== -1) {
                this._showImageViewer(sFilePath, sParam );
            } else {
                // Manejar otros tipos de archivos si es necesario
                sap.m.MessageToast.show("Tipo de archivo no soportado");
            }
        },
        
        
        _showPDFViewer: function(sFilePath, oView, sParam ) {
            if( sParam === "Edit") {
                let oHTML = new HTML({
                    content: "<iframe src='" + sFilePath + "' width='100%' height='300px'></iframe>"
                });
                oView.byId("previewContainerEditPsda").removeAllItems();
                oView.byId("previewContainerEditPsda").addItem(oHTML);
            } else {
                let oHTML = new HTML({
                    content: "<iframe src='" + sFilePath + "' width='100%' height='300px'></iframe>"
                });
                oView.byId("previewContainer").removeAllItems();
                oView.byId("previewContainer").addItem(oHTML);
            }
            
        },
        
        _showImageViewer: function(sFilePath, oView, sParam ) {
            if(sParam === "Edit") {
                let oImage = new sap.m.Image({
                    src: sFilePath
                });
                oView.byId("previewContainerEditPsda").removeAllItems();
                oView.byId("previewContainerEditPsda").addItem(oImage);
             } else {
                let oImage = new sap.m.Image({
                    src: sFilePath
                });
                oView.byId("previewContainer").removeAllItems();
                oView.byId("previewContainer").addItem(oImage);
             } 
          
            },

        _resetFileUploader: function( oView ) { 
            const oModel = oView.getModel("mainModel");
            oModel.setProperty("/DatosFormularioPSDA/payload/mesAinformar", null)
            oModel.setProperty("/OrderNotesTableData", [] );
            oModel.setProperty("/DatosFormularioPSDA/payload/documento/DocumentacionAdicional/Documentacion", {} );
            oModel.setProperty("/DatosFormularioPSDA/payload/documento/File", {} );
            let oFileUploader = oView.byId("fileUploader"); 
                oFileUploader.clear(); 
                oView.byId("previewContainer").removeAllItems(); 

            },

        onOpenDialogOrderNotes: async function ( oView, oModel, oController, isEdit ) {
            if (isEdit === "Edit") {
                const oDialog = await this._openDialog("SELECT_ORDER_NOTES_EDIT", "uimodule.view.desempenioAmbiental.orderNotesRow.edit.OrderNotesEditDialog", oView, oController);
            } else {
                const oDialog = await this._openDialog("SELECT_ORDER_NOTES", "uimodule.view.desempenioAmbiental.orderNotesRow.OrderNotesDialog", oView, oController);            }
            },

        _openDialog: async function (fragmentID, fragmentName, oView, oController ) {
            let oDialog = oView.byId(`${oView.getId()}--${fragmentID}`);
            if (!oDialog) {
                oDialog = await Fragment.load({
                id: oView.getId(),
                name: fragmentName,
                controller: oController
                });
                oView.addDependent(oDialog);
            }
            oDialog.open();
            return oDialog;
            },

        onConfirmDialogOrderNotes: async function ( oEvent , oModel, sParam ) {
            if (sParam === "Edit") {
                const oSource = oEvent.getSource();
                const aItems = oSource.getItems();
                const oSelectedItem = [];
                aItems.forEach(rowList => {
                if (rowList.isSelected()) {
                    const sPath = rowList.getBindingContext("mainModel")["sPath"];
                    oSelectedItem.push(oModel.getProperty(sPath));
                }
                });
                const oItemFormatted = {
                    nota_pedido: oSelectedItem
                }
                oModel.setProperty("/OrderNotesTableEditData", oItemFormatted);
                console.log(oModel)
            } else {
                const oSource = oEvent.getSource();
                const aItems = oSource.getItems();
                const oSelectedItem = [];
                aItems.forEach(rowList => {
                if (rowList.isSelected()) {
                    const sPath = rowList.getBindingContext("mainModel")["sPath"];
                    oSelectedItem.push(oModel.getProperty(sPath));
                }
                });
                oModel.setProperty("/OrderNotesTableData", oSelectedItem);
            }
        },

        //DETALLES DE PSDA
        onViewDetails: function ( oView, oController, oEvent, oModel ) {
            let oButton = oEvent.getSource();
            let oItem = oButton.getParent();
            let oContext = oItem.getBindingContext("mainModel");

            // Obtener los datos de la fila seleccionada
            let oSelectedRow = oContext.getObject();

             const aDesempenioNotaPedido = oSelectedRow.desempenio_nota_pedido;
             const aNotasPedido = [];

             aDesempenioNotaPedido.forEach(item => {
                 if (item.nota_pedido) {
                     aNotasPedido.push(item.nota_pedido);
                 }
             });

         const aDocumentData = [{
             documentoNombre: oSelectedRow.PSDA_firmada_nombre,
             documentoFormato: oSelectedRow.PSDA_firmada_formato,
             documentoFecha: oSelectedRow.createdAt,
             mesActualCargado: oSelectedRow.mes.toString()
         }];

             // Establecer el informe en el modelo para el diálogo
             oModel.setProperty("/DatosFormularioPSDA/TablePSDA/selectedRow", oSelectedRow );
             oModel.setProperty("/DatosFormularioPSDA/TablePSDA/documentAttachmentData", aDocumentData );
             oModel.setProperty("/DatosFormularioPSDA/TablePSDA/mesInformar", oSelectedRow["mes_informar"] ? oSelectedRow["mes_informar"] : "" );
             oModel.setProperty("/DatosFormularioPSDA/TablePSDA/control", oSelectedRow.control );
             oModel.setProperty("/DatosFormularioPSDA/TablePSDA/fechaEntrega", oSelectedRow.fecha_informada );

            if (!oView.byId("detailsPSDADialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "uimodule.view.desempenioAmbiental.details.DetailPSDA",
                    controller: oController
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                oView.byId("detailsPSDADialog").open();
            }
        },

        onEdit: function ( oView, oController, oEvent, oModel ) {
            let oButton = oEvent.getSource();
            let oItem = oButton.getParent();
            let oContext = oItem.getBindingContext("mainModel");

            // Obtener los datos de la fila seleccionada
            let oSelectedRow = oContext.getObject();

           
             
             //Almaceno las Notas de Pedido en su propiedad para edicion y mostrar en Dialog
             const aDesempenioNotaPedido = oSelectedRow.desempenio_nota_pedido;
                const aNotasPedido = [];

                aDesempenioNotaPedido.forEach(item => {
                    if (item.nota_pedido) {
                        aNotasPedido.push(item.nota_pedido);
                    }
                });

            const oOrderNotasFormatter = {
                nota_pedido: aNotasPedido
            }

            const aDocumentData = [{
                documentoNombre: oSelectedRow.PSDA_firmada_nombre,
                documentoFormato: oSelectedRow.PSDA_firmada_formato,
                documentoFecha: oSelectedRow.createdAt,
                mesActualCargado: oSelectedRow.mes.toString()
            }];
            

             oModel.setProperty("/OrderNotesTableEditData", oOrderNotasFormatter);
             // Establecer el informe en el modelo para el diálogo
             oModel.setProperty("/DatosFormularioPSDA/EditSection/selectedRow", oSelectedRow );
             oModel.setProperty("/DatosFormularioPSDA/EditSection/documentAttachmentData", aDocumentData );
             oModel.setProperty("/DatosFormularioPSDA/EditSection/mesInformar", oSelectedRow["mes_informar"] ? oSelectedRow["mes_informar"] : "Sin Informar" );
             oModel.setProperty("/DatosFormularioPSDA/EditSection/control", oSelectedRow.control );
             oModel.setProperty("/DatosFormularioPSDA/EditSection/fechaEntrega", oSelectedRow.fecha_informada );

            if (!oView.byId("editPSDADialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "uimodule.view.desempenioAmbiental.edit.EditPSDA",
                    controller: oController
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                oView.byId("editPSDADialog").open();
            }
        },

        _handleDeletePsdaDocument: async function (oEvent, oView, oModel, oController) {
            let confirmMessage = oView.getModel("i18n").getResourceBundle().getText("deletePsdaDocument");
        
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
        
                            await PSDA_operations.deleteRow(oSelectedRow.ID, oController);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    }
                });
            });
        },
    };
});