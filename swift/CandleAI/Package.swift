// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CandleAI",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "candle-swift", targets: ["CandleAI"])
    ],
    targets: [
        .executableTarget(
            name: "CandleAI",
            path: "Sources/CandleAI"
        )
    ]
)
