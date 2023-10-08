<link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">

<div class="acp-page-container">
  <!-- IMPORT admin/partials/settings/header.tpl -->

  <div class="row m-0">
    <div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
      <form role="form" class="newletter-settings">
        <div class="mb-4">
          <h5 class="fw-bold tracking-tight settings-header">Global Settings</h5>

          <div class="mb-3">
            <label class="form-label" for="emailBlocklistGlobal">Global Email Blocklist</label>
            <textarea class="form-control" id="emailBlocklistGlobal" name="emailBlocklistGlobal" placeholder="user@example.com, user2@example.com"></textarea>
            <p class="form-text">
              List of emails to omit from all newsletters. Comma and newline seperated.
            </p>
          </div>
        </div>
        <div class="mb-4">
          <h5 class="fw-bold tracking-tight settings-header">Templates</h5>

          <div class="">
            <label class="form-label" for="templates">Select Email Template</label>
            <div class="d-flex justify-content-between gap-1">
              <select id="templates" class="form-select">
                <option value="defaultTemplate">Default Template</option>
              </select>
              <button class="btn btn-success text-nowrap" type="button" data-action="template.new"><i class="fa fa-fw fa-regular fa-square-plus"></i></button>
              <button class="btn btn-danger text-nowrap" type="button" data-action="template.delete"><i class="fa fa-fw fa-regular fa-trash-can"></i></button>
            </div>
          </div>
          <div id="template-editor" class="quill"></div>
        </div>
        <div class="mb-4">
          <h5 class="fw-bold tracking-tight settings-header">History</h5>

          <div>Show History</div>
        </div>
        <div class="mb-4">
          <h5 class="fw-bold tracking-tight settings-header">Send Newsletter</h5>

          <div id="newsletter-editor" class="quill"></div>
        </div>
      </form>
    </div>

    <!-- IMPORT admin/partials/settings/toc.tpl -->
  </div>
</div>
