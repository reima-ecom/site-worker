import { sendToElastic } from "./ab-tester-elastic.ts";
import { getCookies, setCookie, uuid } from "../deps.ts";
import { ResponseTransformer } from "../handler.ts";
import "../worker-cloudflare-types.ts";

export type Experiment = {
  name: string;
  variation: string;
  executed?: boolean;
};

export type Experiments = Experiment[];

type PipelineResults = {
  experiments?: Experiments;
  userId?: string;
  response?: Response;
};

/**
 * Read the request cookie and add experiment variations to results
 */
export const _addExperimentVariations = (
  experiments: string[],
  request: Request,
) =>
  (results: PipelineResults): PipelineResults => {
    const cookies = getCookies(request);
    const experimentArray: Experiments = [];
    for (const expName of experiments) {
      if (cookies[expName]) {
        experimentArray.push({ name: expName, variation: cookies[expName] });
      } else {
        const group = Math.random() < 0.5 ? "treatment" : "control"; // 50/50 split
        experimentArray.push({ name: expName, variation: group });
      }
    }
    return {
      ...results,
      experiments: experimentArray,
    };
  };

/**
   * Add user id from the request
   */
export const _addUserId = (request: Request) =>
  (results: PipelineResults): PipelineResults => {
    const cookies = getCookies(request);
    let userId = cookies["exp-id"];
    if (!userId) {
      userId = uuid.generate();
    }
    return {
      ...results,
      userId,
    };
  };

/**
 * Add user id cookie to the response
 */
export const _addUserCookie = (
  results: PipelineResults,
): PipelineResults => {
  const { userId, response } = results;
  // bail if no response or no user id
  if (!response || !userId) return results;
  // max-age is 14 days (60 * 60 * 24 * 14)
  setCookie(response, {
    name: "exp-id",
    value: userId,
    maxAge: 1_209_600,
    path: "/",
    sameSite: "Lax",
  });
  return results;
};

/**
 * Element handler for HTMLRewriter.
 * 
 * Sets the element attribute to the specified variation and
 * sets the experiment `executed` param to true if fired.
 */
export class ExperimentElementHandler {
  experiment: Experiment;
  constructor(experiment: Experiment) {
    this.experiment = experiment;
  }
  element(element: Element) {
    element.setAttribute(this.experiment.name, this.experiment.variation);
    this.experiment.executed = true;
  }
}

export type ExperimentHitSender = (
  userId: string,
  experiments: Experiments,
) => Promise<void>;

/**
 * Document handler for HTMLRewriter.
 * 
 * Will send executed experiments using the specified callback.
 */
export class ExperimentDocumentHandler {
  userId: string;
  experiments: Experiments;
  sendExperimentHits: ExperimentHitSender;
  event: FetchEvent;
  constructor(
    userId: string,
    experiments: Experiments,
    sendExperimentHits: ExperimentHitSender,
    event: FetchEvent,
  ) {
    this.userId = userId;
    this.experiments = experiments;
    this.sendExperimentHits = sendExperimentHits;
    this.event = event;
  }
  end() {
    this.event.waitUntil(
      this.sendExperimentHits(this.userId, this.experiments),
    );
  }
}

/**
 * Take the response and translate based on the experiments.
 * 
 * Track actually executed experiments with the specified method.
 * 
 * @param Rewriter Cloudflare HTMLRewriter
 */
export const _transformForTesting = (
  htmlRewriter: HTMLRewriter,
  sendExperimentHits: ExperimentHitSender,
  event: FetchEvent,
  response: Response,
) =>
  (results: PipelineResults): PipelineResults => {
    // bail if no experiments, response or user id
    if (!results.experiments || !results.userId) {
      return results;
    }

    // add experiment handlers
    for (const experiment of results.experiments) {
      htmlRewriter = htmlRewriter.on(
        `[${experiment.name}]`,
        new ExperimentElementHandler(experiment),
      );
    }

    // add end handler for sending results
    htmlRewriter.onDocument(
      //@ts-ignore because this complains about missing methods
      new ExperimentDocumentHandler(
        results.userId,
        results.experiments,
        sendExperimentHits,
        event,
      ),
    );

    return {
      ...results,
      response: htmlRewriter.transform(response),
    };
  };

/**
 * Add experiments to the response
 */
export const _addExperimentCookies = (
  results: PipelineResults,
): PipelineResults => {
  const { experiments, response } = results;
  // bail if no response or no experiments
  if (!response || !experiments) return results;
  for (const experiment of experiments) {
    // max-age is 14 days (60 * 60 * 24 * 14)
    setCookie(response, {
      name: experiment.name,
      value: experiment.variation,
      maxAge: 1_209_600,
      path: "/",
      sameSite: "Lax",
    });
  }
  return results;
};

export const rewriteForTesting = (
  experiments: string[],
): ResponseTransformer =>
  (event, response) =>
    Promise.resolve({})
      // get requested experiment variations, i.e. experiments enabled in cookie
      .then(_addExperimentVariations(experiments, event.request))
      // get the user id from request
      .then(_addUserId(event.request))
      // transform asset response using htmlrewriter, writing to executedExperiments
      .then(
        _transformForTesting(
          new HTMLRewriter(),
          sendToElastic,
          event,
          response,
        ),
      )
      // add experiment cookies
      .then(_addExperimentCookies)
      // add user id cookie
      .then(_addUserCookie)
      // return response
      .then(({ response }) => response);
