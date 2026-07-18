/*
 Candle AI — Swift companion module
 Provides native helpers for macOS Desktop access, notifications, and path bridging.
*/

import Foundation
import AppKit

public struct CandleAI {
    public static let version = "1.0.0"
    public static let tagline = "Light up the way for your ideas"

    public static var desktopURL: URL {
        FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSHomeDirectory()).appendingPathComponent("Desktop")
    }

    public static func listDesktop() throws -> [String] {
        let items = try FileManager.default.contentsOfDirectory(
            at: desktopURL,
            includingPropertiesForKeys: [.isDirectoryKey, .fileSizeKey],
            options: [.skipsHiddenFiles]
        )
        return items.map { $0.lastPathComponent }.sorted()
    }

    public static func openInFinder(_ path: String) {
        let url = URL(fileURLWithPath: path)
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }
}

@main
struct CandleAIMain {
    static func main() {
        print("Candle AI Swift companion v\(CandleAI.version)")
        print(CandleAI.tagline)
        print("Desktop: \(CandleAI.desktopURL.path)")
        do {
            let items = try CandleAI.listDesktop()
            print("Desktop items: \(items.count)")
            for item in items.prefix(20) {
                print(" - \(item)")
            }
        } catch {
            print("Desktop list error: \(error)")
        }
    }
}
