define(['app', 'core/UIComponent', 'core/CustomUIView', '../../../assets/js/libs/quill', 'core/t', 'core/overlays/overlays'], function (app, UIComponent, UIView, Quill, __t, Overlays) {

  var Input = UIView.extend({
    template: 'quill/input',
    serialize: function () {
      var length = this.options.schema.get('char_length');
      var value = this.options.value || '';

      return {
        height: this.options.settings.get('height'),
        bold: (this.options.settings.get('bold') === true),
        italic: (this.options.settings.get('italic') === true),
        underline: (this.options.settings.get('underline') === true),
        strikethrough: (this.options.settings.get('strikethrough') === true),
        rule: (this.options.settings.get('rule') === true),
        h1: (this.options.settings.get('h1') === true),
        h2: (this.options.settings.get('h2') === true),
        h3: (this.options.settings.get('h3') === true),
        h4: (this.options.settings.get('h4') === true),
        h5: (this.options.settings.get('h5') === true),
        h6: (this.options.settings.get('h6') === true),
        blockquote: (this.options.settings.get('blockquote') === true),
        ul: (this.options.settings.get('ul') === true),
        ol: (this.options.settings.get('ol') === true),
        orderedList: (this.options.settings.get('orderedList') === true),
        createlink: (this.options.settings.get('createlink') === true),
        insertimage: (this.options.settings.get('insertimage') === true),
        embedVideo: (this.options.settings.get('embedVideo') === true),
        embed_width: this.options.settings.get('embed_width'),
        embed_height: this.options.settings.get('embed_height'),
        html: (this.options.settings.get('html') === true),
        maxLength: length,
        characters: length - value.length,
        name: this.options.name,
        value: value,
      }
    },
    afterRender: function () {

      // TODO: Move this to the html template and add ui options to enable disable them
      var toolbarOptions = [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],
        [{'header': 1}, {'header': 2}],               // custom button values
        [{'list': 'ordered'}, {'list': 'bullet'}],
        [{'script': 'sub'}, {'script': 'super'}],      // superscript/subscript
        [{'indent': '-1'}, {'indent': '+1'}],          // outdent/indent
        [{'direction': 'rtl'}],                         // text direction
        [{'header': [1, 2, 3, 4, 5, 6, false]}],
        [{'color': []}, {'background': []}],          // dropdown with defaults from theme
        [{'font': []}],
        [{'align': []}],
        ['clean'],                                         // remove formatting button
        ['image', 'video', 'link']            // Image video and code links
      ];

      // create our quill instance and set it to window so we can grab it anywhere
      window.quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
          toolbar: toolbarOptions
        }
      });

      // Set our text-change event handler
      window.quill.on('text-change', this.setText);

      // Add the Content from the db into the Quill editor at the start
      window.quill.clipboard.dangerouslyPasteHTML(0, this.options.value);

      // // set our custom image handler
      var toolbar = window.quill.getModule('toolbar').addHandler('image', this.showImageUI)

    },
    setText: function (event) {
      // We set our text from quill to the hidden named input
      $('#quill_value').val(window.quill.root.innerHTML);
    },
    showImageUI: function (event) {
      //TODO: Finish this method
      // This opens up or image select/upload dialog and inserts the selected/uploaded image
      console.log('Showing the Image Upload UI');
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
        var url = window.location.protocol + "//" + window.location.host + "/" + model.makeFileUrl(false);
        var title = model.attributes.title;
        self.editor.composer.commands.exec("insertImage", {src: url, alt: title, title: title});
        $('.directus-alert-modal').addClass('hide'); //  manually close modal
      };
    }
  });

  var Component = UIComponent.extend({
    id: 'quill',
    dataTypes: ['VARCHAR', 'TEXT'],
    variables: [
      // Disables editing of the field while still letting users see the value
      {id: 'readonly', type: 'Boolean', default_value: false, ui: 'checkbox'},
      // The input's height in pixels before scrolling. Default: 500px
      {id: 'height', type: 'Number', default_value: 500, ui: 'numeric'},
      {id: 'bold', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'italic', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'underline', type: 'Boolean', default_value: true, ui: 'checkbox'},
      {id: 'strikethrough', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'rule', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'createlink', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'insertimage', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'embedVideo', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'embed_width', type: 'Number', default_value: 300, ui: 'numeric'},
      {id: 'embed_height', type: 'Number', default_value: 200, ui: 'numeric'},
      {id: 'html', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'orderedList', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'h1', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'h2', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'h3', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'h4', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'h5', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'h6', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'blockquote', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'ul', type: 'Boolean', default_value: false, ui: 'checkbox'},
      {id: 'ol', type: 'Boolean', default_value: false, ui: 'checkbox'}
    ],
    Input: Input,
    validate: function (value, options) {
      if (options.schema.isRequired() && _.isEmpty(value)) {
        return __t('this_field_is_required');
      }
    },
    list: function () {
      // Just return back some lines we really don't want to show the content
      return '<span class="silver">--</span>';
    }
  });


  return Component;
});
