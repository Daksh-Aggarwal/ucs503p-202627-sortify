# W3: Model Candidates and Shortlisting

## Objective

This week, I looked at different ML models for Sortify. My goal was to find model options that are simple, practical, and possible for our project.

## Work Done

- I compared training a model from scratch with using a pretrained model.
- I found that training from scratch would take more data, more time, and more computing power.
- Because of that, I decided it would be better to use pretrained models.
- I looked at common image classification models that are often used with transfer learning.
- I focused mainly on MobileNet, ResNet, and EfficientNet.
- While comparing them, I also thought about our app needs.
- The model should not be too heavy or too slow.
- It should also be accurate enough to identify waste categories properly.

## Shortlist

- `MobileNetV2`
  Lightweight and faster, so it looks useful for a mobile or efficient setup.
- `ResNet50`
  A strong and reliable model that can work as a good baseline.
- `EfficientNet-B0`
  A balanced option that may give both good accuracy and good efficiency.

## Initial Scope

- For now, I selected `MobileNetV2`, `ResNet50`, and `EfficientNet-B0` as the main models to consider.
- These models seem practical for our timeline and project scope.
- I did not keep very heavy models in the shortlist.
- I also did not consider building a custom model from scratch for the first version.

## Outcome

- By the end of the week, I had reduced the model choices to three practical options.
- The selected models are `MobileNetV2`, `ResNet50`, and `EfficientNet-B0`.
- These will be easier to test and compare in the next stage.

## What I Learned

- Model selection is not only about accuracy.
- It also depends on time, data, and ease of use.
- Pretrained models are more suitable for our project than building a model from scratch.
- Shortlisting early makes the next steps easier.
