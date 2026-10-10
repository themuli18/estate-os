import Foundation
import Vision
import AppKit

// One JSON array: per recognised line its text and normalised box (x, y, w, h; origin bottom-left).
// Usage: ocr_boxes <image> [languages]
let args = CommandLine.arguments
guard args.count > 1 else { print("usage: ocr_boxes <image> [languages]"); exit(1) }
let langs = args.count > 2 ? args[2].split(separator: ",").map(String.init) : ["de-DE", "en-US"]
guard let img = NSImage(contentsOfFile: args[1]),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(2) }
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.recognitionLanguages = langs
req.usesLanguageCorrection = true
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([req])
var out: [[String: Any]] = []
for obs in (req.results ?? []) {
    guard let top = obs.topCandidates(1).first else { continue }
    let b = obs.boundingBox
    out.append(["text": top.string, "x": b.origin.x, "y": b.origin.y, "w": b.size.width, "h": b.size.height,
                "conf": top.confidence])
}
let data = try JSONSerialization.data(withJSONObject: out, options: [])
print(String(data: data, encoding: .utf8)!)
