# Operations Workspace One-Page SOP

This SOP is for the operations team to create or update a locality homepage and publish it safely.

## Goal

Use this flow when you need to:

- create or update homepage sections
- update hero banner
- update ads or offers
- preview the final homepage
- publish it live

## Step 1: Open the correct workspace

Click in this order:

1. `Admin Console`
2. `Operations Workspace`
3. `Homepage CMS`

## Step 2: Select the locality

At the top filter bar:

1. Click `All localities`
2. Select the target locality
   Example: `Roadpali`, `Kalamboli`

Do this before editing anything.

## Step 3: Arrange homepage sections

Click in this order:

1. `Homepage CMS`
2. `Layout`

To add a new section:

1. Select `Section type`
2. Enter `Insert position`
   Use `1` to add at the top
3. Fill section fields
4. Click `Add Homepage Section`

To edit an existing section:

1. Find the section card
2. Click the expand arrow
3. Update the fields
4. Changes auto-save

To delete a section:

1. Find the section card
2. Click the `Delete` icon

To reorder a section:

1. Use `Insert position` while creating new section
2. Or use up/down arrows on existing section cards

## Step 4: Update hero banner

Click in this order:

1. `Homepage CMS`
2. `Hero Banners`

Fill:

1. `Locality`
2. `Hero title`
3. `Hero subtitle`
4. `Hero image URL` or upload image
5. `Start date`
6. `End date`
7. `CTA label`
8. `CTA type`
9. `CTA target`
10. `Target pincodes` if needed

Then click:

1. `Create Hero Banner`

If editing:

1. Click `Edit`
2. Change fields
3. Click `Update Hero Banner`

## Step 5: Update ad banners

Click in this order:

1. `Ads & Offers`
2. `Ad Banners`

Fill:

1. `Ad title`
2. `Ad description`
3. `Badge`
4. `CTA text`
5. `Start date`
6. `End date`
7. `Action type`
8. `Locality`
9. `Placement key`
10. `Target categories` if needed
11. `Image URL` or upload image
12. `Target pincodes` if needed

Then click:

1. `Create Ad Banner`

## Step 6: Update offers

Click in this order:

1. `Ads & Offers`
2. `Offers`

Fill:

1. `Select business`
2. `Offer title`
3. `Coupon code`
4. `Discount label`
5. `Offer description`
6. `Locality`
7. `Pincodes` if needed
8. `Start date`
9. `End date`

Then click:

1. `Create Offer`

## Step 7: Update locality content

Click in this order:

1. `Updates & Community`

Fill:

1. `Type`
2. `Author`
3. `Status`
4. `Publish date`
5. `Expiry date` if needed
6. `Image` or image URL
7. `Update title`
8. `Update content`

Then click:

1. `Create Locality Update`

## Step 8: Create template if needed

Use this only when admin asks for reusable setup.

Click in this order:

1. `Homepage CMS`
2. `Templates`

Fill:

1. `Template name`
2. `Template scope`
3. `Priority`
4. `Template localities`
5. `Default fallback` only when this should be the one system-wide fallback template
6. `Status = Active`

Rule:

- Only one `Active + Default fallback` template is allowed at a time.

Then click:

1. `Create Template`

If layout is already ready and should be copied into template:

1. Open the template with `Edit`
2. Click `Sync Sections`

## Step 9: Create assignment if needed

Use this only when admin asks to activate a template through scalable mapping.

Click in this order:

1. `Homepage CMS`
2. `Assignments`

Fill:

1. `Locality`
2. `Template`
3. `Category` if required, otherwise leave blank
4. `Subcategory` if required, otherwise leave blank
5. `Pincode` if required, otherwise leave blank
6. `Priority`
7. `Status = Active`

Then click:

1. `Create Assignment`

## Step 10: Preview before publish

Click in this order:

1. `Homepage CMS`
2. `Snapshots & Preview`

Fill:

1. `Locality`
2. `Device`
3. `Page type`
4. `Category` if needed
5. `Subcategory` if needed
6. `Pincode` if needed
7. Keep `Use published snapshots` unchecked for first preview

Then click:

1. `Load Resolved Preview`

Check:

1. correct template
2. correct sections
3. correct hero
4. correct ads
5. correct offers
6. correct content

## Step 11: Publish

Option A: publish one preview context

1. Stay in `Snapshots & Preview`
2. Click `Publish This Preview Context`

Option B: publish full locality

1. Click `Homepage CMS`
2. Click `Publish`
3. Click `Publish Selected Locality`

## Step 12: Final validation

After publish:

1. Go back to `Snapshots & Preview`
2. Turn on `Use published snapshots`
3. Click `Load Resolved Preview`
4. Open the public locality page
5. Confirm hero, sections, ads, offers, and updates are correct

## Daily Safe Rule

Always follow this order:

1. Select locality
2. Update layout
3. Update hero
4. Update ads/offers/content
5. Preview
6. Publish
7. Validate public page

## Do Not Do

- do not publish before preview
- do not edit the wrong locality
- do not use fallback unless instructed
- do not change route/pincode mapping unless required
- do not assume auto-saved edits are already published

## Escalate To Admin/Tech Team If

- section is not deleting
- template tab or form is not visible
- preview is different from public page
- publish completes but snapshots remain `0`
- wrong locality opens for the selected pincode
