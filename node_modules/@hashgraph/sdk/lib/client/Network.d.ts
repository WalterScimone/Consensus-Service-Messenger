/**
 * @typedef {import("../channel/Channel.js").default} Channel
 */
/**
 * @typedef {import("./Client.js").NetworkName} NetworkName
 */
/**
 * @template {Channel} ChannelT
 */
export default class Network<ChannelT extends import("../channel/Channel.js").default> {
    /**
     * @param {(address: string) => ChannelT} createNetworkChannel
     */
    constructor(createNetworkChannel: (address: string) => ChannelT);
    /**
     * @type {{[key: string]: (string | AccountId)}}
     */
    network: {
        [key: string]: string | AccountId;
    };
    /**
     * Map of node account ID (as a string)
     * to the node URL.
     *
     * @internal
     * @type {Map<string, Node<ChannelT>>}
     */
    networkNodes: Map<string, Node<ChannelT>>;
    /**
     * List of node account IDs.
     *
     * @private
     * @type {Node<ChannelT>[]}
     */
    private nodes;
    /** @type {(address: string) => ChannelT} */
    createNetworkChannel: (address: string) => ChannelT;
    /** @type {string | null} */
    _ledgerId: string | null;
    /**
     * @param {{[key: string]: (string | AccountId)}} network
     */
    setNetwork(network: {
        [key: string]: string | AccountId;
    }): void;
    /**
     * @internal
     * @returns {number}
     */
    getNumberOfNodesForTransaction(): number;
    /**
     * @internal
     * @returns {AccountId[]}
     */
    getNodeAccountIdsForExecute(): AccountId[];
    close(): void;
}
export type Channel = import("../channel/Channel.js").default;
export type NetworkName = import("./Client.js").NetworkName;
import AccountId from "../account/AccountId.js";
import Node from "../Node.js";
