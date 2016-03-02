<div class="composer" component="composer" id="cmp-uuid-newsletter">
<div id="newsletter">
    <h1><i class="fa fa-fw fa-newspaper-o"></i>Newsletter</h1>
    <div class="row">
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-subject">Subject</label>
            <input class="form-control" id="newsletter-subject" type="text"/>
        </div>
    </div>
    <div class="btn-toolbar formatting-bar row">
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-template">Body</label><span> ( Parsed as a Post, and you can use &#123;username&#125; )</span>
        </div>
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-preview">Preview</label>
        </div>
        <div class="btn-group col-sm-12">
            <!-- BEGIN formatting -->
                <!-- IF formatting.spacer -->
                <span class="btn spacer"></span>
                <!-- ELSE -->
                <!-- IF !formatting.mobile -->
                <span class="btn btn-link" tabindex="-1" data-format="{formatting.name}"><i class="{formatting.className}"></i></span>
                <!-- ENDIF !formatting.mobile -->
                <!-- ENDIF formatting.spacer -->
            <!-- END formatting -->
            <span class="btn btn-link img-upload-btn hide" data-format="picture" tabindex="-1">
                <i class="fa fa-picture-o"></i>
            </span>
            <span class="btn btn-link file-upload-btn hide" data-format="upload" tabindex="-1">
                <i class="fa fa-upload"></i>
            </span>
            <form id="fileForm" method="post" enctype="multipart/form-data">
                <input type="file" id="files" name="files[]" multiple class="gte-ie9 hide"/>
            </form>
        </div>
    </div>
    <div class="row">
        <div class="form-group col-md-6">
            <textarea class="form-control" id="newsletter-template"></textarea>
        </div>
        <div class="form-group col-md-6">
            <div class="form-control preview" id="newsletter-preview"></div>
        </div>
    </div>
    <div class="row">
        <div class="form-group col-md-6">
            <label class="form-label" for="newsletter-group">Send to Group</label>
            <select class="form-control" id="newsletter-group">
                <option value="everyone">Everyone</option>
                <option value="administrators">Administrators</option>
                <!-- BEGIN groups -->
                <option value="{groups.name}">{groups.name}</option>
                <!-- END groups -->
            </select>
        </div>
    </div>
    <div class="row">
        <div class="form-group col-md-6">
            <button class="btn btn-success" type="button" id="newsletter-send"><i class="fa fa-fw fa-newspaper-o"></i> Send Newsletter</input>
        </div>
    </div>
</div>
</div>
