sap.ui.define(
	["sap/ui/model/json/JSONModel", "sap/base/Log"],
	function (JSONModel, Log) {
		"use strict";

		return {
            _evaluatePermissionsForSections: function (oInformesData, oControlesData, oInformesAmbientalesData, oDocumentacionAdicionalData, oUserRolesData) {
                // Verificar roles y asignar permisos según las secciones
                if (oUserRolesData.value.includes("PGO_Contratista")) {
                    // Evaluar permisos para oInformesData
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "BO") {
                            permisos.canEdit = true;
                            permisos.canDelete = true;
                            permisos.canView = true;
                            permisos.canSend = true;
                        } else if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
                    
                    // Evaluar permisos para oControlesData
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "BO") {
                            permisos.canEdit = true;
                            permisos.canDelete = true;
                            permisos.canView = true;
                            permisos.canSend = true;
                        } else if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
                    
                    // Evaluar permisos para oInformesAmbientalesData
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canNextApprove: false,
                            canSend: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "BO") {
                            permisos.canEdit = true;
                            permisos.canDelete = true;
                            permisos.canView = true;
                            permisos.canSend = true;
                        } else if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    // Evaluar permisos para oDocumentacionAdicionalData
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "BO") {
                            permisos.canEdit = true;
                            permisos.canDelete = true;
                            permisos.canView = true;
                            permisos.canSend = true;
                        } else if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
                } else if (oUserRolesData.value.includes("PGO_Inspector")) {
                    // Verificar permisos para PGO_Inspector
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                         if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }

                        item.permisos = permisos;
                    });
                    
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
                } else if (oUserRolesData.value.includes("PGO_JefeInspeccion")) {
                    // Verificar permisos para PGO_Inspector
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }

                        item.permisos = permisos;
                    });
                    
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canApprove = true;
                            permisos.canReject = true;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
                } else if (oUserRolesData.value.includes("PGO_JefeArea")) {
                    // Verificar permisos para PGO_Inspector
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true; 
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        }

                        item.permisos = permisos;
                    });
                    
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true; 
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true; 
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true; 
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                            permisos.canNextApprove = true;
                            permisos.canReject = true;
                        }
                        item.permisos = permisos;
                    });
                } else if (oUserRolesData.value.includes("PGO_Gerente")) {
                    // Verificar permisos para PGO_Inspector
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }

                        item.permisos = permisos;
                    });
                    
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
            
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        }
                        item.permisos = permisos;
                    });
                } else if (oUserRolesData.value.includes("PGO_Director")) {
                    // Verificar permisos para PGO_Inspector
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } 

                        item.permisos = permisos;
                    });
                    
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } 
                        item.permisos = permisos;
                    });
            
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } 
                        item.permisos = permisos;
                    });
            
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                        if (item.estado_ID === "PI") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canView = true;
                        } else if (item.estado_ID === "PJA") {
                            permisos.canView = true;
                        } 
                        item.permisos = permisos;
                    });
                } else if (oUserRolesData.value.includes("PGO_AreaMedioAmbiente")) {
                    // Verificar permisos para PGO_Inspector
                    oInformesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };

                         if (item.estado_ID === "PI") {
                            permisos.canEdit = false;
                            permisos.canDelete = false;
                            permisos.canView = true;
                        } else if (item.estado_ID === "PA") {
                            permisos.canEdit = false;
                            permisos.canDelete = false;
                            permisos.canNextApprove = true,
                            permisos.canView = true;
                        }

                        item.permisos = permisos;
                    });
                    
                    oControlesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        item.permisos = permisos;
                    });
            
                    oInformesAmbientalesData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        item.permisos = permisos;
                    });
            
                    oDocumentacionAdicionalData.value.forEach(item => {
                        const permisos = {
                            canEdit: false,
                            canDelete: false,
                            canApprove: false,
                            canSend: false,
                            canNextApprove: false,
                            canReject: false,
                            canView: false,
                            canDownloadFile: false,
                            canDeleteFile: false
                        };
                        item.permisos = permisos;
                    });
                }
            
                // Agregar más lógica según las necesidades específicas de cada sección
            
                return { oInformesData, oControlesData, oInformesAmbientalesData, oDocumentacionAdicionalData };
            }            

		};
	});