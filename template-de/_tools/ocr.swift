import Foundation
import Vision
import AppKit

// Print the recognised text of one image, line by line (Apple Vision, on-device).
// Usage: ocr <image> [languages]   e.g. ocr seite.png de-DE,en-US
let args = CommandLine.arguments
guard args.count > 1 else { print("usage: ocr <image> [languages]"); exit(1) }
let langs = args.count > 2 ? args[2].split(separator: ",").map(String.init) : ["de-DE", "en-US"]
guard let img = NSImage(contentsOfFile: args[1]),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { print("image not readable"); exit(2) }
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.recognitionLanguages = langs
req.usesLanguageCorrection = true
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([req])
for obs in (req.results ?? []) {
    if let top = obs.topCandidates(1).first { print(top.string) }
}
