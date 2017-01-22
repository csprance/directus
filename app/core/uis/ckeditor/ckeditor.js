//  Color core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// CKEditor Docs: http://docs.ckeditor.com/


define(['app', 'core/UIComponent', 'core/UIView', 'core/t', 'core/overlays/overlays'], function (app, UIComponent, UIView, __t, Overlays) {

  'use strict';

  var template = '<form action="">' +
    '<textarea name="ckeditor_{{name}}" id="ckeditor_{{name}}" row="10" cols="80">' +
   ' {{value}}' +
  '</textarea>' +
  '</form>' +
  '<input type="hidden" name="{{name}}" class="hidden_input" id="ckeditor_value_{{name}}" value="{{value}}">';


  var Input = UIView.extend({
    events: {},
    templateSource: template,
    serialize: function () {
      var value = this.options.value || '';
      return {
        name: this.options.name,
        value: value
      }
    },
    /**
     * Life cycle hook called by Directus after everything is rendered on the page
     * Use this section to set up anything that requires HTML nodes
     */
    afterRender: function () {
      var that = this,
        cdn = "//cdn.ckeditor.com/4.6.0/full/ckeditor.js",
        //TODO: can't get the server to work so use the CDN for now
        server = window.location.origin + window.directusData.path + "assets/js/libs/ckeditor/ckeditor.js";


      $.ajax({
        url: cdn,
        dataType: "script",
        success: function () {
          that.initEditor();
        }
      });


    },
    /**
     * This is the logic required to set up the entire CKEditor
     * as well as the associated dialog tweaks TO CKEDITOR to work with Directus
     */
    initEditor: function () {
      var that = this;

      var editorConfig = {
        // override custom config
        readOnly: that.options.settings.get('readonly'),
        height: that.options.settings.get('height'),
        customConfig: '',
        toolbar:	// TODO: Hook the options up here from the UIOptions
          [
            {
              name: 'clipboard',
              items: that.options.settings.get('clipboard') ? ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] : []
            },
            {name: 'editing', items: that.options.settings.get('editing') ? ['Scayt'] : []},
            {name: 'links', items: that.options.settings.get('links') ? ['Link', 'Unlink', 'Anchor'] : []},
            {
              name: 'insert',
              items: that.options.settings.get('insert') ? ['Image', 'Table', 'HorizontalRule', 'SpecialChar'] : []
            },
            {name: 'tools', items: that.options.settings.get('tools') ? ['Maximize'] : []},
            {name: 'document', items: that.options.settings.get('document') ? ['Source'] : []},
            '/',
            {
              name: 'basicstyles',
              items: that.options.settings.get('basicstyles') ? ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat'] : []
            },
            {
              name: 'paragraph',
              items: that.options.settings.get('paragraph') ? ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote'] : []
            },
            {name: 'styles', items: that.options.settings.get('styles') ? ['Styles', 'Format'] : []}
          ]
      };

      // set our image dialog stuff
      CKEDITOR.on('dialogDefinition', function (ev) {
        // Take the dialog window name and its definition from the event data.
        var dialogName = ev.data.name;
        var dialogDefinition = ev.data.definition;

        if (dialogName == 'image') {

          // Get a reference to the "Link Info" tab and the "Browse" button.
          var infoTab = dialogDefinition.getContents('info');
          var browseButton = infoTab.get('browse');


          //Make the browse button visible and add a onClick function
          browseButton.hidden = false;
          browseButton.onClick = function () {
            // Show the image UI and set the info:urlTxt
            that.showImageUI();
          };


          // show the upload tab
          var uploadTab = dialogDefinition.getContents('Upload');
          uploadTab.hidden = false;

          var chooseFileBtn = uploadTab.get('upload');
          chooseFileBtn.onClick = function (e) {
            that.inputFile = e.data.$.target;
          };


          // Change the upload button to not do anything
          var uploadButton = uploadTab.get('uploadButton');
          uploadButton.onClick = function () {
            that.handleFileSelect(that.inputFile);
            return false;
          }
        }
      });


      //this is where we set up the editor
      var editor = CKEDITOR.replace('ckeditor_' + this.options.name, editorConfig);

      // Set our text-change event handler to set our value
      editor.on('change', function (evt) {
        // getData() returns CKEditor's HTML content.
        $('#ckeditor_value_' + that.options.name).val(evt.editor.getData());
      });

      // Add the Content from the db into the CKEditor instance at the start
      editor.setData(that.options.value);


    },
    /**
     * Shows the Directus user interface for selecting files on the server
     * @param {element} input - The selector for the input:file element
     */
    handleFileSelect: function (input) {
      var file = [input.files[0]];
      var self = this;
      var model = new app.files.model({}, {collection: app.files});
      //send files takes a list
      app.sendFiles(file, function (data) {
        _.each(data, function (item) {
          item[app.statusMapping.status_name] = app.statusMapping.active_num;
          item.id = undefined;
          item.user = self.userId;
          model.save(item, {
            success: function (e) {
              var url = window.location.protocol + "//" + window.location.host + model.makeFileUrl(false);
              var title = model.attributes.title;

              var dialog = CKEDITOR.dialog.getCurrent();
              dialog.getContentElement('info', 'txtUrl').setValue(url);
              dialog.selectPage('info');
            }
          });
        });
      });


    },
    /**
     * Shows the Directus user interface for selecting files on the server
     */
    showImageUI: function () {
      // TODO: Fix the canceled state to show the CKEditor dialog again.
      // Hide these cke_dialog_background_cover cke_reset_all
      $('.cke_reset_all').css({display: 'none'});
      $('.cke_dialog_background_cover').css({display: 'none'});

      // This opens up or image select/upload dialog and inserts the selected/uploaded image
      var collection = app.files;
      var model;
      var fileModel = new app.files.model({}, {collection: collection});
      collection.fetch();
      var view = new Overlays.ListSelect({collection: collection, selectable: false});
      app.router.overlayPage(view);
      var self = this;
      view.itemClicked = function (e) {
        var id = $(e.target).closest('tr').attr('data-id');
        model = collection.get(id);
        app.router.removeOverlayPage(this);

        var url = window.location.protocol + "//" + window.location.host + model.makeFileUrl(false);

        // set the CKEDitor Image dialog back to normal
        $('.cke_reset_all').css({display: 'block'});
        $('.cke_dialog_background_cover').css({display: 'block'});

        // set the CKEditor image Url
        var dialog = CKEDITOR.dialog.getCurrent();
        dialog.getContentElement('info', 'txtUrl').setValue(url);
      };
    },

    initialize: function () {
      //
    }


  });

  var Component = UIComponent.extend({
    id: 'ckeditor',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      // Disables editing of the field while still letting users see the value
      //TODO: Hook these up
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
      // The input's height in pixels before scrolling. Default: 500px
      {id: 'height', type: 'Number', default_value: 500, ui: 'numeric'},
      {id: 'clipboard', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'editing', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'links', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'insert', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'tools', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'document', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'basicstyles', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'paragraph', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'styles', type: 'Boolean', default_value: true, ui: 'checkbox'},

    ],
    Input: Input,
    /**
     * This is sent before the row is saved and is used to validate any form values
     * @param {obj} value - the value of the field
     * @param {obj} options - global options object
     */
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    /**
     * This is what is shown in list views
     */
    list: function () {
      // Just return back some lines we really don't want to show the content
      return '<span class="silver">--</span>';
    }
  });


  return Component;
});
