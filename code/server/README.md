# Sortify detector API

This service receives one image and returns YOLO detections using the same ten class IDs as the data-preprocessing report and the Expo client.

## Run locally

Place a trusted model file at `server/models/best.pt` (preferred) or provide its location through `MODEL_PATH`. Python pickles are accepted only when `ALLOW_PICKLE=true`; a pickle can run code when loaded, so never enable this for a file from an untrusted source.

The current `models/best.pt` is the trained ten-class Sortify checkpoint. The health endpoint reports `sortify-trained` when its class order matches the application contract. `yolo11s.pt` is instead the stock 80-class COCO model; the API can run it in a clearly identified compatibility profile for a limited demo only.

```sh
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
set -a; source .env; set +a
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Check that the model loads at `http://127.0.0.1:8000/health`. For a physical phone, use the computer's LAN IP, for example `http://192.168.1.20:8000`; `localhost` points to the phone itself.

The API accepts `POST /v1/detections` as multipart form data with an `image` field. It uses confidence `0.25` and NMS IoU `0.45` by default, and returns boxes as fractions of the original image dimensions so the client can accurately overlay them when an image is displayed with `contain`.

If the exported `.pkl` is not a YOLO-compatible object with a `predict()` method returning Ultralytics-style boxes, export the trained model as `best.pt` or ONNX instead. The current report describes a YOLOv11 detector, for which `best.pt` is the natural deployment artifact.
