sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
       "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem",
    "sap/m/Button"
], function (MessageBox, BusyIndicator, MessagePopover, MessagePopoverItem, Button) {
    "use strict";

    return {
        dialogBusy: function (bBusy) {
            if (bBusy) {
                BusyIndicator.show(0);
            } else {
                BusyIndicator.hide();
            }
        },

        
        showMessage: function (sMessage, sTitle, sType) {
            switch (sType) {
                case "ERROR":
                    MessageBox.error(sMessage, { title: sTitle });
                    break;
                case "WARNING":
                    MessageBox.warning(sMessage, { title: sTitle });
                    break;
                case "SUCCESS":
                    MessageBox.success(sMessage, { title: sTitle });
                    break;
                default:
                    MessageBox.information(sMessage, { title: sTitle });
            }
        },

        createMessagePopover: function (messages) {
            var oMessagePopover = new MessagePopover({
                endButton: new Button({
                    text: "OK",
                    press: function () {
                        oMessagePopover.close();
                    }
                })
            });

            messages.forEach(function (message) {
                oMessagePopover.addItem(new MessagePopoverItem({
                    type: message.type,
                    title: message.title,
                    description: message.description
                }));
            });

            return oMessagePopover;
        },

        showMessagePopover: function (messages, oControl) {
            var oMessagePopover = this.createMessagePopover(messages);
            oMessagePopover.openBy(oControl);
        },

    
    };
});