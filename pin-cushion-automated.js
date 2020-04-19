/**
 * A class for managing additional Map Pin functionality
 * @author Evan Clarke (errational#2007)
 */
class PinCushionAutomated {

    /* -------------------------------- Constants ------------------------------- */

    static get MODULE_NAME() {
        return "pin-cushion";
    }

    static get MODULE_TITLE() {
        return "Pin Cushion";
    }

    static get DIALOG() {
        return {
            content: `<div class="form-group"><p class="notes">Enter a name:</p></label><input name="name" type="text"></div></br>`,
            title: "Map Pin Name"
        }
    }

    /* --------------------------------- Methods -------------------------------- */
    
    /**
     * Register listeners
     */
    registerListeners() {
        canvas.stage.on("click", event => this._onClickCanvas(event));
    }

    /**
     * Creates and renders a dialog for name entry
     * @param {*} data 
     */
    _createDialog(data) {
        const dialogData = data;

        new Dialog({
            title: PinCushionAutomated.DIALOG.title,
            content: PinCushionAutomated.DIALOG.content,
            buttons: {
                save: {
                    label: "Save",
                    icon: `<i class="fas fa-check"></i>`,
                    callback: async e => {
                        const input = e.find("input[name='name']");
                        if(input[0].value) {
							//Check if that Journal entry already exists
							let entry = game.journal.getName(input[0].value);
							if (entry === null) {
								// Create entry
								entry = await JournalEntry.create({name: `${input[0].value}`});
							}
							
							// Check if there is a number, so that the Pin-Number can be set
							const number_list = input[0].value.match(/(\d+)/);
							let number = number_list[0];
							// Default is 01 if there was no valid number
							if (number < 0 || number > 99) { number = "01"; }
							// Add a Zero for 1-digit numbers
							else if (number >= 0 && number <= 9) { number = "0" + number; }
							
                            // Create Note data
                            const data = {
                                entryId: entry.data._id,
                                x: dialogData.x,
                                y: dialogData.y,
                                icon: `Pins/${number}.svg`, //CONST.DEFAULT_NOTE_ICON,
                                iconSize: 120,
                                textAnchor: CONST.TEXT_ANCHOR_POINTS.BOTTOM,
                                fontSize: 48
                            };
                        
                            // Validate the final position is in-bounds
                            if ( !canvas.grid.hitArea.contains(data.x, data.y) ) {
                                return;
                            }
                        
                            // Create a NoteConfig sheet instance to finalize the creation
                            const note = canvas.activeLayer.preview.addChild(new Note(data).draw());
                            note.sheet.render(true);
                        }
                    }
                },
                cancel: {
                    label: "Cancel",
                    icon: `<i class="fas fa-times"></i>`,
                    callback: e => {
                        // Maybe do something in the future
                    }
                }
            },
            default: "save"
        }).render(true);
    }

    /* -------------------------------- Listeners ------------------------------- */

    /**
     * Handles canvas clicks
     */
    _onClickCanvas(event) {
        const now = Date.now();
    
        if (canvas.activeLayer.name !== "NotesLayer" || canvas.activeLayer._hover) {
            return;
        }
        
        // If the click is less than 250ms since the last clicktime, it must be a doubleclick
        if (now - event.data.clickTime < 250) {
            this._onDoubleClick(event);
        }
        // Set clickTime to enable doubleclick detection
        event.data.clickTime = now;
    }
    
    /**
     * Handles doubleclicks
     * @param {*} event 
     */
    _onDoubleClick(event) {
        const data = {
            x: event.data.destination.x,
            y: event.data.destination.y
        }

        this._createDialog(data);
    }
}

/* -------------------------------------------------------------------------- */
/*                                    Hooks                                   */
/* -------------------------------------------------------------------------- */

/**
 * Hook on note config render to inject filepicker and remove selector
 */
Hooks.on("renderNoteConfig", (app, html, data) => {
    const filePickerHtml = 
        `<input type="text" name="icon" title="Icon Path" class="icon-path" value="${data.object.icon}" placeholder="/icons/example.svg" data-dtype="String">
        <button type="button" name="file-picker" class="file-picker" data-type="image" data-target="icon" title="Browse Files" tabindex="-1">
        <i class="fas fa-file-import fa-fw"></i>
        </button>`

    const iconSelector = html.find("select[name='icon']");

    iconSelector.replaceWith(filePickerHtml);

    // Detect and activate file-picker buttons
    html.find('button.file-picker').each((i, button) => app._activateFilePicker(button));
});

/**
 * Hook on delete note to fix core bug with hover not being cleared on delete
 */
Hooks.on("deleteNote", (scene, sceneId, data, options, userId) =>{
    return canvas.activeLayer._hover ? canvas.activeLayer._hover = null : null;
});

/**
 * Hook on canvas ready to register click listener
 */
Hooks.on("canvasReady", (app, html, data) => {
    const PinCushionAutomated = new PinCushionAutomated();

    PinCushionAutomated.registerListeners();
});